import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { StatusCodes } from 'http-status-codes';
import { DateTime } from 'luxon';

import Api from '../Api';
import UnexpectedError from '../UnexpectedError';
import ValidationError from '../ValidationError';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

function MeetingForm({ isTemplate }) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { meetingId } = useParams();
  const meetingTemplateId = useMemo(() => new URLSearchParams(search).get('meetingTemplateId'), [search]);

  const [meeting, setMeeting] = useState();
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (meetingTemplateId) {
      Api.meetingTemplates.get(meetingTemplateId).then((response) => {
        const { latestAt, callLink, callDetails, topic, maxUploadsCount, allowedUserIds, frequency } = response.data;
        let startsAt = DateTime.fromISO(latestAt).plus({ days: frequency }).toISO();
        if (startsAt.includes('.')) {
          startsAt = startsAt.substring(0, startsAt.indexOf('.'));
        }
        setMeeting({
          MeetingTemplateId: meetingTemplateId,
          startsAt,
          callLink,
          callDetails,
          topic,
          maxUploadsCount,
          allowedUserIds,
        });
      });
    } else if (meetingId) {
      let request;
      if (isTemplate) {
        request = Api.meetingTemplates.get(meetingId);
      } else {
        request = Api.meetings.get(meetingId);
      }
      request.then((response) => {
        let { id, MeetingTemplateId, startsAt, callLink, callDetails, topic, maxUploadsCount, allowedUserIds } = response.data;
        startsAt = DateTime.fromISO(startsAt).toISO();
        if (startsAt.includes('.')) {
          startsAt = startsAt.substring(0, startsAt.indexOf('.'));
        }
        setMeeting({
          id,
          MeetingTemplateId,
          startsAt,
          callLink,
          callDetails,
          topic,
          maxUploadsCount,
          allowedUserIds,
        });
      });
    } else {
      setMeeting({
        startsAt: '',
        callLink: '',
        callDetails: '',
        topic: '',
        maxUploadsCount: 4,
        allowedUserIds: null,
        frequency: null,
      });
    }
  }, [meetingId, meetingTemplateId, isTemplate]);

  function onChange(event) {
    const newMeeting = { ...meeting };
    let { name, value } = event.target;
    if (name === 'frequency' || name === 'maxUploadsCount') {
      value = parseInt(value);
    }
    newMeeting[name] = value;
    setMeeting(newMeeting);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setUploading(true);
    // set local time zone
    meeting.startsAt = DateTime.fromISO(meeting.startsAt, { zone: 'local' }).toISO();
    try {
      let state = {};
      if (meeting.id) {
        if (isTemplate) {
          await Api.meetingTemplates.update(meeting.id, meeting);
          state.flash = 'Recurring Meeting updated!';
          navigate('/meetings', state);
        } else {
          await Api.meetings.update(meeting.id, meeting);
          state.flash = 'Meeting updated!';
          navigate(`/meetings/${meeting.id}`, state);
        }
      } else {
        await Api.meetings.create(meeting);
        state.flash = 'Meeting created!';
        navigate('/meetings', state);
      }
    } catch (error) {
      setUploading(false);
      if (error.response?.status === StatusCodes.UNPROCESSABLE_ENTITY) {
        setError(new ValidationError(error.response.data));
      } else {
        setError(new UnexpectedError());
      }
    }
    window.scrollTo(0, 0);
  }

  return (
    <main className="container">
      <div className="row justify-content-center">
        {meeting && (
          <div className="col col-sm-10 col-md-8 col-lg-6 col-xl-4">
            <h1>
              {meeting.id ? 'Edit' : 'New'} {isTemplate ? 'Recurring ' : ''}Meeting
            </h1>
            <form onSubmit={onSubmit}>
              <fieldset disabled={isUploading}>
                {error && error.message && <div className="alert alert-danger">{error.message}</div>}
                {!isTemplate && (
                  <div className="mb-3">
                    <label className="form-label" htmlFor="startsAt">
                      Date/Time
                    </label>
                    <input
                      type="datetime-local"
                      className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('startsAt') })}
                      id="startsAt"
                      name="startsAt"
                      onChange={onChange}
                      value={meeting.startsAt ?? ''}
                    />
                    {error?.errorMessagesHTMLFor?.('startsAt')}
                  </div>
                )}
                {!meeting.id && !meetingTemplateId && (
                  <div className="mb-3">
                    <label className="form-label" htmlFor="frequency">
                      Recurring?
                    </label>
                    <select
                      className={classNames('form-select', { 'is-invalid': error?.errorsFor?.('frequency') })}
                      id="frequency"
                      name="frequency"
                      onChange={onChange}
                      value={meeting.frequency ?? ''}>
                      {!isTemplate && <option value="">No</option>}
                      <option value="7">Weekly</option>
                      <option value="14">Biweekly</option>
                    </select>
                    {error?.errorMessagesHTMLFor?.('frequency')}
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label" htmlFor="topic">
                    Topic
                  </label>
                  <textarea
                    className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('topic') })}
                    id="topic"
                    name="topic"
                    onChange={onChange}
                    value={meeting.topic ?? ''}
                  />
                  {error?.errorMessagesHTMLFor?.('topic')}
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="callLink">
                    Call Link
                  </label>
                  <input
                    type="text"
                    className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('callLink') })}
                    id="callLink"
                    name="callLink"
                    onChange={onChange}
                    value={meeting.callLink ?? ''}
                  />
                  {error?.errorMessagesHTMLFor?.('callLink')}
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="callDetails">
                    Call Details
                  </label>
                  <textarea
                    className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('callDetails') })}
                    id="callDetails"
                    name="callDetails"
                    onChange={onChange}
                    value={meeting.callDetails ?? ''}
                  />
                  {error?.errorMessagesHTMLFor?.('callDetails')}
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="maxUploadsCount">
                    Max photos per member
                  </label>
                  <input
                    type="number"
                    className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('maxUploadsCount') })}
                    id="maxUploadsCount"
                    name="maxUploadsCount"
                    onChange={onChange}
                    value={meeting.maxUploadsCount ?? ''}
                  />
                  {error?.errorMessagesHTMLFor?.('maxUploadsCount')}
                </div>
                <div className="mb-3 d-grid">
                  <button className="btn btn-primary" type="submit">
                    Submit
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

export default MeetingForm;
