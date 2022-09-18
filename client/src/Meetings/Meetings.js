import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import Pagination from '../Components/Pagination';

import './Meetings.scss';

function Meetings() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [meetings, setMeetings] = useState([]);
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const page = parseInt(params.get('page') ?? '1', 10);
  const [lastPage, setLastPage] = useState(1);
  const [meetingTemplates, setMeetingTemplates] = useState([]);

  useEffect(() => {
    if (user) {
      Api.meetings.index(page).then((response) => {
        setMeetings(response.data);
        const linkHeader = Api.parseLinkHeader(response);
        let newLastPage = page;
        if (linkHeader?.last) {
          const match = linkHeader.last.match(/page=(\d+)/);
          newLastPage = parseInt(match[1], 10);
        } else if (linkHeader?.next) {
          newLastPage = page + 1;
        }
        setLastPage(newLastPage);
      });
      if (user.isAdmin) {
        Api.meetingTemplates.index().then((response) => setMeetingTemplates(response.data));
      }
    }
  }, [user, page]);

  return (
    <main className="meetings container">
      <h1>Meetings</h1>
      {user?.isAdmin && (
        <>
          <div className="mb-5 text-center">
            <Link to="/meetings/new" className="btn btn-outline-primary">
              New Meeting
            </Link>
          </div>
          {meetingTemplates.length > 0 && (
            <>
              <h2>Manage Recurring Meetings</h2>
              <div className="table-responsive mb-5">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th className="">Topic</th>
                      <th className="">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meetingTemplates.map((mt) => (
                      <tr key={mt.id}>
                        <td>{mt.topic}</td>
                        <td>
                          <Link to={`/meetings/new?meetingTemplateId=${mt.id}`}>Create Next Meeting</Link>
                          &nbsp;|&nbsp;
                          <Link to={`/meetings/templates/${mt.id}/edit`}>Edit Meeting Template</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <h2>Meetings</h2>
        </>
      )}
      <div className="table-responsive mb-5">
        <table className="table table-hover">
          <thead>
            <tr>
              <th className="w-20">Date/Time</th>
              <th className="">Topic</th>
            </tr>
          </thead>
          <tbody>
            {meetings.map((meeting) => (
              <tr key={meeting.id} onClick={() => navigate(`/meetings/${meeting.id}`)}>
                <td>{DateTime.fromISO(meeting.startsAt).toFormat("ccc, LLL d 'at' h:mm a")}</td>
                <td>{meeting.topic.split('\n')[0].trim()}</td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} lastPage={lastPage} />
      </div>
    </main>
  );
}
export default Meetings;
