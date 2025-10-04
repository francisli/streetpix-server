import PropTypes from 'prop-types';

import './ExternalLink.scss';

function ExternalLink({ href, children }) {
  const parts = href.split('//');
  return (
    <a className="external-link" href={href} target="_blank" rel="noreferrer">
      {children ||
        (parts.length > 1 ? (
          <>
            {parts[0]}
            <span>/</span>/{parts[1]}
          </>
        ) : (
          href
        ))}
    </a>
  );
}

ExternalLink.propTypes = {
  href: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default ExternalLink;
