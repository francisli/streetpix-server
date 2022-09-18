import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LinkItUrl } from 'react-linkify-it';
import { DateTime } from 'luxon';
import seedrandom from 'seedrandom';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import Photo from '../Photos/Photo';

import './Meeting.scss';

function Meeting() {
  const { user } = useAuthContext();
  const { meetingId } = useParams();
  const [meeting, setMeeting] = useState();
  const [sort, setSort] = useState('random');

  const { photoId } = useParams();

  useEffect(() => {
    if (meetingId) {
      Api.meetings.get(meetingId).then((response) => setMeeting(response.data));
    }
  }, [meetingId]);

  const users = [];
  const photosByUser = {};
  if (meeting?.MeetingSubmissions) {
    for (const meetingSubmission of meeting.MeetingSubmissions) {
      const user = meetingSubmission.Photo.User;
      if (!photosByUser[user.id]) {
        users.push(user);
        photosByUser[user.id] = [];
      }
      photosByUser[user.id].push(meetingSubmission);
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
        }
      }
      if (found && nextPhotoId) {
        break;
      }
    }
  }

  function onDeleted(id) {
    const index = meeting.MeetingSubmissions.findIndex((ms) => ms.Photo.id === id);
    if (index >= 0) {
      meeting.MeetingSubmissions.splice(index, 1);
      setMeeting({ ...meeting });
    }
  }

  return (
    <main className="container">
      {photoId ? (
        <Photo id={photoId} nextId={nextPhotoId} prevId={prevPhotoId} onDeleted={onDeleted} />
      ) : (
        <>
          <h1>Meeting</h1>
          {meeting && (
            <div className="row">
              <div className="col-lg-4 mb-5">
                <dl>
                  <dt>Date/Time</dt>
                  <dd>{DateTime.fromISO(meeting.startsAt).toFormat("cccc, LLLL d 'at' h:mm a")}</dd>
                  <dt>Topic</dt>
                  <dd className="meeting__topic">
                    <LinkItUrl>{meeting.topic}</LinkItUrl>
                  </dd>
                  <dt>Call Details</dt>
                  <dd>
                    <div className="mb-3">{meeting.callDetails}</div>
                    {user.isAdmin && (
                      <Link to={`/meetings/${meetingId}/edit`} className="btn btn-outline-primary me-3 mb-3">
                        Edit Meeting
                      </Link>
                    )}
                    <a className="btn btn-outline-primary me-3 mb-3" href={meeting.callLink} target="_blank" rel="noreferrer">
                      Join Call
                    </a>
                    <Link to={`/meetings/${meetingId}/upload`} className="btn btn-outline-primary mb-3">
                      Upload Photos
                    </Link>
                  </dd>
                </dl>
              </div>
              <div className="col-lg-8">
                <div className="row mb-4 justify-content-end">
                  <div className="col-lg-5 col-xl-4">
                    <div className="btn-group d-block">
                      <input
                        type="radio"
                        className="btn-check"
                        name="sort"
                        id="random"
                        autocomplete="off"
                        onClick={() => setSort('random')}
                        checked={sort === 'random'}
                      />
                      <label class="btn btn-outline-primary w-50" for="random">
                        Random
                      </label>
                      <input
                        type="radio"
                        className="btn-check"
                        name="sort"
                        id="alpha"
                        autocomplete="off"
                        onClick={() => setSort('alpha')}
                        checked={sort === 'alpha'}
                      />
                      <label class="btn btn-outline-primary w-50" for="alpha">
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
