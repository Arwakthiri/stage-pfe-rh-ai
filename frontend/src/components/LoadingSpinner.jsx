import './LoadingSpinner.css';

const LoadingSpinner = ({ fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="spinner-fullscreen">
        <div className="spinner-ring">
          <div></div><div></div><div></div><div></div>
        </div>
      </div>
    );
  }
  return (
    <div className="spinner-ring spinner-sm">
      <div></div><div></div><div></div><div></div>
    </div>
  );
};

export default LoadingSpinner;
