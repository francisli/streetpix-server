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
  const year = params.get('year') ?? `${DateTime.now().year}`;
  const [meetingTemplates, setMeetingTemplates] = useState([]);

  useEffect(() => {
    if (user) {
      Api.meetings.index(year, page).then((response) => {
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
  }, [user, year, page]);

  function setYear(event) {
    navigate(`?year=${event.target.value}`);
  }

  const now = DateTime.now().minus({ hours: 2 });
  let nextMeeting;
  let hasUpcomingMeetings = false;
  for (const meeting of meetings) {
    const startsAt = DateTime.fromISO(meeting.startsAt);
    if (startsAt < now) {
      break;
    }
    if (nextMeeting) {
      hasUpcomingMeetings = true;
    }
    nextMeeting = meeting;
  }

  const currentYear = now.year;
  const yearStarted = 2021;

  return (
    <main className="meetings container">
      <h1>Meetings</h1>
      <div className="d-flex justify-content-center mb-3">
        <div className="d-flex align-items-center">
          Year:
          <select className="form-select ms-2" value={year} onChange={setYear}>
            <option value="all">All</option>
            {[...Array(currentYear - yearStarted + 1)].map((_, i) => (
              <option>{currentYear - i}</option>
            ))}
          </select>
        </div>
      </div>
      {user?.isAdmin && (year === 'all' || parseInt(year, 10) === currentYear) && (
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
        </>
      )}
      {nextMeeting && (
        <>
          <h2>Next Meeting</h2>
          <div className="table-responsive mb-5">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th className="w-20">Date/Time</th>
                  <th className="w-30">Topic</th>
                  <th>My Uploads</th>
                </tr>
              </thead>
              <tbody>
                <tr key={nextMeeting.id} onClick={() => navigate(`/meetings/${nextMeeting.id}`)}>
                  <td className="text-nowrap">{DateTime.fromISO(nextMeeting.startsAt).toFormat("ccc, LLL d, yyyy 'at' h:mm a")}</td>
                  <td>{nextMeeting.topic.split('\n')[0].trim()}</td>
                  <td className="meetings__previews">
                    {nextMeeting.MeetingSubmissions.sort((a, b) => a.position - b.position).map((ms) => (
                      <div key={ms.id} className="meetings__preview">
                        <div className="square">
                          <div className="square__content" style={{ backgroundImage: `url(${ms.Photo?.thumbUrl})` }}></div>
                        </div>
                      </div>
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {hasUpcomingMeetings && (
            <>
              <h2>Upcoming Meetings</h2>
              <div className="table-responsive mb-5">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th className="w-20">Date/Time</th>
                      <th className="w-30">Topic</th>
                      <th>My Uploads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...meetings].reverse().map((meeting) =>
                      DateTime.fromISO(meeting.startsAt) >= now && meeting !== nextMeeting ? (
                        <tr key={meeting.id} onClick={() => navigate(`/meetings/${meeting.id}`)}>
                          <td className="text-nowrap">{DateTime.fromISO(meeting.startsAt).toFormat("ccc, LLL d, yyyy 'at' h:mm a")}</td>
                          <td>{meeting.topic.split('\n')[0].trim()}</td>
                          <td className="meetings__previews">
                            {meeting.MeetingSubmissions.sort((a, b) => a.position - b.position).map((ms) => (
                              <div key={ms.id} className="meetings__preview">
                                <div className="square">
                                  <div className="square__content" style={{ backgroundImage: `url(${ms.Photo?.thumbUrl})` }}></div>
                                </div>
                              </div>
                            ))}
                          </td>
                        </tr>
                      ) : null
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
      <h2>Past Meetings</h2>
      <div className="table-responsive mb-5">
        <table className="table table-hover">
          <thead>
            <tr>
              <th className="w-20">Date/Time</th>
              <th className="w-30">Topic</th>
              <th>My Uploads</th>
            </tr>
          </thead>
          <tbody>
            {meetings.map((meeting) =>
              DateTime.fromISO(meeting.startsAt) < now && meeting !== nextMeeting ? (
                <tr key={meeting.id} onClick={() => navigate(`/meetings/${meeting.id}`)}>
                  <td className="text-nowrap">{DateTime.fromISO(meeting.startsAt).toFormat("ccc, LLL d, yyyy 'at' h:mm a")}</td>
                  <td>{meeting.topic.split('\n')[0].trim()}</td>
                  <td className="meetings__previews">
                    {meeting.MeetingSubmissions.sort((a, b) => a.position - b.position).map((ms) => (
                      <div key={ms.id} className="meetings__preview">
                        <div className="square">
                          <div className="square__content" style={{ backgroundImage: `url(${ms.Photo?.thumbUrl})` }}></div>
                        </div>
                      </div>
                    ))}
                  </td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>
        <Pagination page={page} lastPage={lastPage} otherParams={{ year }} />
      </div>
    </main>
  );
}
export default Meetings;
