const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-credits">
            <a href="https://www.codealpha.com" target="_blank" rel="noopener noreferrer">
              <h5>Challenge Task by CodeAlpha</h5>
            </a>
            <a href="https://www.linkedin.com/in/your-linkedin" target="_blank" rel="noopener noreferrer">
              <h5>Developed by Ushindi Bihame</h5>
            </a>
          </div>
          <div className="footer-github">
            <h3>Check out my GitHub!!</h3>
            <div className="github-link">
              <i className="fas fa-hand-point-down"></i>
              <a href="https://github.com/ub-victor" target="_blank" rel="noopener noreferrer" className="github-btn">
                <i className="fab fa-github"></i> Visit GitHub
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Copyright &copy; <span id="current-year">{currentYear}</span> Ushindi Bihame - All Rights Reserved</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;