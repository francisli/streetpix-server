import React, { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { Link, useParams } from 'react-router-dom';
import { LinkItUrl } from 'react-linkify-it';
import { DateTime } from 'luxon';
import seedrandom from 'seedrandom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-regular-svg-icons';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import Photo from '../Photos/Photo';

import './Meeting.scss';

function Meeting() {
  const { user } = useAuthContext();
  const { meetingId } = useParams();
  const [meeting, setMeeting] = useState();
  const [cookies, setCookie, removeCookie] = useCookies(['sort', 'startTime', 'endTime']);
  const { sort = 'random' } = cookies;
  function setSort(newSort) {
    setCookie('sort', newSort);
  }
  const startTime = cookies.startTime ? DateTime.fromSeconds(parseInt(cookies.startTime, 10)) : null;
  function setStartTime(newStartTime) {
    if (newStartTime) {
      setCookie('startTime', `${newStartTime.toSeconds()}`);
    } else {
      setCookie('startTime', '');
    }
  }
  const endTime = cookies.endTime ? DateTime.fromSeconds(parseInt(cookies.endTime, 10)) : null;
  function setEndTime(newEndTime) {
    if (newEndTime) {
      setCookie('endTime', `${newEndTime.toSeconds()}`);
    } else {
      setCookie('endTime', '');
    }
  }
  // check if timer is from another day, if so, clear
  if (endTime && endTime.toLocaleString(DateTime.DATE_SHORT) !== DateTime.now().toLocaleString(DateTime.DATE_SHORT)) {
    setEndTime();
  }

  const { photoId } = useParams();

  useEffect(() => {
    if (meetingId) {
      Api.meetings.get(meetingId).then((response) => setMeeting(response.data));
    }
  }, [meetingId]);

  const users = [];
  const photosByUser = {};
  let photoCount = 0;
  if (meeting?.MeetingSubmissions) {
    for (const meetingSubmission of meeting.MeetingSubmissions) {
      const user = meetingSubmission.Photo.User;
      if (!photosByUser[user.id]) {
        users.push(user);
        photosByUser[user.id] = [];
      }
      photosByUser[user.id].push(meetingSubmission);
      photoCount += 1;
    }
    if (sort === 'alpha') {
      users.sort((u1, u2) => {
        let result = u1.firstName.localeCompare(u2.firstName);
        if (result === 0) {
          result = u1.lastName.localeCompare(u2.lastName);
        }
        if (result === 0) {
          result = u1.id - u2.id;
        }
        return result;
      });
    } else {
      const rng = seedrandom(meetingId);
      users.sort((a, b) => 0.5 - rng());
    }
  }

  let prevPhotoId;
  let nextPhotoId;
  let currentCount = 0;
  if (photoId) {
    let found = false;
    for (const user of users) {
      const submissions = photosByUser[user.id];
      if (submissions) {
        for (const ms of submissions) {
          if (found) {
            nextPhotoId = ms.Photo.id;
            break;
          }
          if (ms.Photo.id === photoId) {
            found = true;
            continue;
          }
          prevPhotoId = ms.Photo.id;
          if (!found) {
            currentCount += 1;
          }
        }
      }
      if (found && nextPhotoId) {
        break;
      }
    }
  }

  let photoDuration;
  if (startTime && endTime) {
    let { seconds } = endTime.diff(startTime, 'seconds');
    photoDuration = Math.floor(seconds / photoCount);
    if (photoId && currentCount > 0) {
      ({ seconds } = endTime.diff(DateTime.now(), 'seconds'));
      photoDuration = Math.min(photoDuration, Math.floor(seconds / (photoCount - currentCount)));
    }
  }

  function onDeleted(id) {
    const index = meeting.MeetingSubmissions.findIndex((ms) => ms.Photo.id === id);
    if (index >= 0) {
      meeting.MeetingSubmissions.splice(index, 1);
      setMeeting({ ...meeting });
    }
  }

  function setUpTimer() {
    setStartTime(DateTime.now());
    let newEndTime = DateTime.now().plus({ hours: 2 }).set({ minute: 0 });
    setEndTime(newEndTime);
  }

  function onChangeEndTime(event) {
    const { value } = event.target;
    if (value) {
      const newEndTime = DateTime.fromFormat(value, 'HH:mm');
      setEndTime(newEndTime);
    } else {
      setEndTime();
    }
  }

  return (
    <main className="container">
      {photoId ? (
        <Photo id={photoId} nextId={nextPhotoId} prevId={prevPhotoId} onDeleted={onDeleted} timerDuration={photoDuration} />
      ) : (
        <>
          <h1>Meeting</h1>
          {meeting && (
            <div className="row">
              <div className="col-lg-4 mb-5">
                <dl>
                  <dd>
                    {user.isAdmin && (
                      <Link to={`/meetings/${meetingId}/edit`} className="btn btn-outline-primary me-3 mb-3">
                        Edit Meeting
                      </Link>
                    )}
                    {meeting.callLink && (
                      <a className="btn btn-outline-primary me-3 mb-3" href={meeting.callLink} target="_blank" rel="noreferrer">
                        Join Call
                      </a>
                    )}
                    <Link to={`/meetings/${meetingId}/upload`} className="btn btn-outline-primary mb-3">
                      Upload Photos
                    </Link>
                  </dd>
                  <dt>Date/Time</dt>
                  <dd>{DateTime.fromISO(meeting.startsAt).toFormat("cccc, LLLL d, yyyy 'at' h:mm a")}</dd>
                  <dt>Topic</dt>
                  <dd className="meeting__topic">
                    <LinkItUrl>{meeting.topic}</LinkItUrl>
                  </dd>
                  {meeting.callDetails && (
                    <>
                      <dt>Call details</dt>
                      <dd className="meeting__call-details">
                        <LinkItUrl>{meeting.callDetails}</LinkItUrl>
                      </dd>
                    </>
                  )}
                </dl>
              </div>
              <div className="col-lg-8">
                <div className="row mb-4 justify-content-between">
                  <div className="col-lg-7 mb-3">
                    {!endTime && (
                      <button onClick={setUpTimer} className="btn btn-outline-primary">
                        <FontAwesomeIcon icon={faClock} /> Set up Timer
                      </button>
                    )}
                    {endTime && (
                      <form className="d-flex">
                        <label className="col-form-label text-nowrap me-2" htmlFor="endTime">
                          End at:
                        </label>
                        <input
                          type="time"
                          id="endTime"
                          className="form-control me-2 "
                          onChange={onChangeEndTime}
                          style={{ maxWidth: '130px' }}
                          min={startTime.toLocaleString(DateTime.TIME_24_SIMPLE)}
                          value={endTime.toLocaleString(DateTime.TIME_24_SIMPLE)}
                        />
                        <span className="col-form-label text-muted text-nowrap me-2">
                          {photoDuration >= 60 && <>({Math.floor(photoDuration / 60)} min/ph)</>}
                          {photoDuration < 60 && <>({photoDuration} sec/ph)</>}
                        </span>
                        <button onClick={() => setEndTime()} className="btn btn-sm btn-outline-primary">
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>
                  <div className="col-lg-5 col-xl-4">
                    <div className="btn-group d-block">
                      <input
                        type="radio"
                        className="btn-check"
                        name="sort"
                        id="random"
                        autoComplete="off"
                        onChange={() => setSort('random')}
                        checked={sort === 'random'}
                      />
                      <label className="btn btn-outline-primary w-50" htmlFor="random">
                        Random
                      </label>
                      <input
                        type="radio"
                        className="btn-check"
                        name="sort"
                        id="alpha"
                        autoComplete="off"
                        onChange={() => setSort('alpha')}
                        checked={sort === 'alpha'}
                      />
                      <label className="btn btn-outline-primary w-50" htmlFor="alpha">
                        Alphabetical
                      </label>
                    </div>
                  </div>
                </div>
                {users.map((u) => (
                  <React.Fragment key={u.id}>
                    <div className="d-flex align-items-center">
                      <h3>
                        {u.firstName} {u.lastName}
                      </h3>
                    </div>
                    <div className="row">
                      {photosByUser[u.id]
                        .sort((a, b) => a.position - b.position)
                        .map((ms) => (
                          <div key={ms.Photo.id} className="thumbnail col-md-3">
                            <div className="thumbnail__content">
                              <Link to={ms.Photo.id} className="square">
                                <div className="square__content" style={{ backgroundImage: `url(${ms.Photo.thumbUrl})` }}></div>
                              </Link>
                            </div>
                          </div>
                        ))}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
export default Meeting;
