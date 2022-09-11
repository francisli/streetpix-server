import { useCallback, useEffect, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';

import { useAuthContext } from '../AuthContext';

import './InteractivePhoto.scss';

function InteractivePhoto({ id, alt, url, onKeyDown }) {
  const { user } = useAuthContext();
  const ref = useRef();
  const imgRef = useRef();
  const [imageStyle, setImageStyle] = useState();

  const socketUrl = `${window.location.origin.replace(/^http/, 'ws')}/photo?id=${id}`;
  const { lastJsonMessage, sendJsonMessage } = useWebSocket(socketUrl, { shouldReconnect: () => true });

  const [pointers, setPointers] = useState({});

  const [cropStart, setCropStart] = useState();
  const [cropDrag, setCropDrag] = useState();
  const [cropEnd, setCropEnd] = useState();

  useEffect(() => {
    if (lastJsonMessage) {
      const { type, user } = lastJsonMessage;
      if (user) {
        const userId = user.id;
        switch (type) {
          case 'pointer':
            setPointers((pointers) => {
              clearTimeout(pointers[userId]?.timeoutId);
              const pointer = { ...lastJsonMessage };
              pointer.timeoutId = setTimeout(() => {
                setPointers((pointers) => {
                  const newPointers = {};
                  Object.values(pointers).forEach((pointer) => {
                    if (pointer.user.id !== userId) {
                      newPointers[pointer.user.id] = pointer;
                    }
                  });
                  return newPointers;
                });
              }, 5000);
              pointers[userId] = pointer;
              return { ...pointers };
            });
            break;
          case 'crop':
            setCropStart(lastJsonMessage.start);
            setCropDrag(lastJsonMessage.drag);
            setCropEnd(lastJsonMessage.end);
            break;
          default:
            break;
        }
      }
    }
  }, [lastJsonMessage]);

  function normalizeMouseLocation(event) {
    if (imageStyle) {
      const dx = (event.clientX - imageStyle.left) / imageStyle.width;
      const dy = (event.clientY - imageStyle.top) / imageStyle.height;
      return { dx, dy };
    }
    return {};
  }

  function onMouseMove(event) {
    if (!user) {
      return;
    }
    const { dx, dy } = normalizeMouseLocation(event);
    if (dx && dy) {
      sendJsonMessage({ user: { id: user.id, firstName: user.firstName }, type: 'pointer', dx, dy });
      if (cropStart && !cropEnd) {
        setCropDrag({ dx, dy });
        sendJsonMessage({ user: { id: user.id }, type: 'crop', start: cropStart, drag: { dx, dy } });
      }
    }
  }

  function onKeyDownInternal(event) {
    if (cropStart) {
      setCropStart();
      setCropEnd();
      sendJsonMessage({ user: { id: user.id }, type: 'crop' });
    }
    onKeyDown(event);
  }

  function onMouseDown(event) {
    if (!user) {
      return;
    }
    const { dx, dy } = normalizeMouseLocation(event);
    if (dx && dy) {
      if (cropStart && cropEnd) {
        setCropStart();
        setCropEnd();
        sendJsonMessage({ user: { id: user.id }, type: 'crop' });
        setTimeout(() => ref.current?.focus(), 0);
      } else if (cropStart) {
        setCropEnd({ dx, dy });
        sendJsonMessage({ user: { id: user.id }, type: 'crop', start: cropStart, end: { dx, dy } });
      } else {
        setCropStart({ dx, dy });
        setCropDrag({ dx, dy });
      }
    }
  }

  function pointerStyle(pointer) {
    if (imageStyle) {
      return {
        top: pointer.dy * imageStyle.height + imageStyle.top,
        left: pointer.dx * imageStyle.width + imageStyle.left,
      };
    }
    return { top: 0, left: 0 };
  }

  const calculateImageRect = useCallback(() => {
    if (ref.current && imgRef.current) {
      const style = {};
      const wratio = ref.current.offsetWidth / imgRef.current.naturalWidth;
      const hratio = ref.current.offsetHeight / imgRef.current.naturalHeight;
      if (hratio < wratio) {
        style.width = Math.floor((ref.current.offsetHeight * imgRef.current.naturalWidth) / imgRef.current.naturalHeight);
        style.height = ref.current.offsetHeight;
      } else if (hratio > wratio) {
        style.width = ref.current.offsetWidth;
        style.height = Math.floor((ref.current.offsetWidth * imgRef.current.naturalHeight) / imgRef.current.naturalWidth);
      } else {
        style.width = ref.current.offsetWidth;
        style.height = ref.current.offsetHeight;
      }
      style.left = Math.floor((ref.current.offsetWidth - style.width) / 2);
      style.top = Math.floor((ref.current.offsetHeight - style.height) / 2);
      setImageStyle(style);
    }
  }, []);

  useEffect(() => {
    function resizeHandler(event) {
      calculateImageRect();
    }
    window.addEventListener('resize', resizeHandler);
    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, [calculateImageRect]);

  let crop;
  if (cropStart && imageStyle) {
    crop = {};
    crop.left = Math.min(cropStart.dx, cropEnd?.dx ?? cropDrag.dx) * imageStyle.width + imageStyle.left;
    crop.top = Math.min(cropStart.dy, cropEnd?.dy ?? cropDrag.dy) * imageStyle.height + imageStyle.top;
    crop.right = (1 - Math.max(cropStart.dx, cropEnd?.dx ?? cropDrag.dx)) * imageStyle.width + imageStyle.left;
    crop.bottom = (1 - Math.max(cropStart.dy, cropEnd?.dy ?? cropDrag.dy)) * imageStyle.height + imageStyle.top;
  }

  return (
    <div
      className="interactive-photo"
      ref={ref}
      tabIndex={0}
      onKeyDown={onKeyDownInternal}
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}>
      <img className="interactive-photo__image" onLoad={calculateImageRect} src={url} alt={alt} ref={imgRef} style={imageStyle} />
      {Object.values(pointers).map((p) => (
        <div key={p.user.id} className="interactive-photo__pointer" style={pointerStyle(p)}>
          <div className="interactive-photo__pointer-name">{p.user.firstName}</div>
        </div>
      ))}
      {crop && <div className="interactive-photo__crop interactive-photo__crop--top" style={{ height: crop.top }} />}
      {crop && (
        <div
          className="interactive-photo__crop interactive-photo__crop--left"
          style={{ top: crop.top, bottom: crop.bottom, width: crop.left }}
        />
      )}
      {crop && (
        <div
          className="interactive-photo__crop interactive-photo__crop--right"
          style={{ top: crop.top, bottom: crop.bottom, width: crop.right }}
        />
      )}
      {crop && <div className="interactive-photo__crop interactive-photo__crop--bottom" style={{ height: crop.bottom }} />}
    </div>
  );
}

export default InteractivePhoto;
