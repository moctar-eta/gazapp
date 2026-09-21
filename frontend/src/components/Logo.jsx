import logo from "../assets/logo.jpg";

export default function Logo({ width = 160, className = "", circle = false }) {
  if (circle) {
    return (
      <div
        style={{ width, height: width }}
        className={`overflow-hidden rounded-full bg-white ${className}`}
      >
        <img src={logo} alt="Bezeid" className="h-full w-full object-cover" style={{ objectPosition: "18% 40%" }} />
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt="Bezeid"
      style={{ width }}
      className={`rounded-xl object-contain ${className}`}
    />
  );
}
