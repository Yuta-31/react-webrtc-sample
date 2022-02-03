
import React from 'react';

export default function VideoView() {
  const videoRef = React.useRef(null);
  const constraints = {
    video: true,
    audio: false,
  }

  React.useEffect(() => {
    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((error) => {
        console.log(error);
      })
  }, []);

  return (
    <div className="VideoView">
      <video playsInline autoPlay ref={videoRef} />
    </div>
  )
}
