import PhotoUploader from '../Photos/PhotoUploader';

function UserUpload() {
  return (
    <main className="container">
      <div className="row justify-content-center">
        <h1>Upload Photos</h1>
        <div className="col-md-6">
          <PhotoUploader />
        </div>
      </div>
    </main>
  );
}
export default UserUpload;
