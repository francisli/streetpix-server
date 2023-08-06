function License({ selected }) {
  return (
    <>
      {selected === 'allrightsreserved' && <span>All Rights Reserved</span>}
      {selected === 'ccby' && <a href="https://creativecommons.org/licenses/by/4.0/">CC BY</a>}
      {selected === 'ccbysa' && <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA</a>}
      {selected === 'ccbync' && <a href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC</a>}
      {selected === 'ccbyncsa' && <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA</a>}
      {selected === 'ccbynd' && <a href="https://creativecommons.org/licenses/by-nd/4.0/">CC BY-ND</a>}
      {selected === 'publicdomain' && <a href="https://creativecommons.org/publicdomain/zero/1.0/">Public Domain</a>}
    </>
  );
}
export default License;
