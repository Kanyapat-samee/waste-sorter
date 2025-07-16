const Navbar = ({ setShowClassify }) => {
  const handleClick = () => {
    setShowClassify(false);

    const heroSection = document.getElementById("hero");
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav>
      <div className="logo">
        <button onClick={handleClick} className="logo-btn">
          <span>WASTE SORT</span>
        </button>
      </div>
      <div className="menu-btn">
        <span>MENU</span>
      </div>
    </nav>
  );
};

export default Navbar;
