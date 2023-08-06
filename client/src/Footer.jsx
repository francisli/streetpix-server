import './Footer.scss';

function Footer() {
  return (
    <footer className="footer text-muted">
      <div className="container">Copyright &copy; {new Date().getFullYear()} SF Bay Street Photography</div>
    </footer>
  );
}
export default Footer;
