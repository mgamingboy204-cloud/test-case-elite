import Image from "next/image";

export function HomeBackground() {
  return (
    <div className="home-hero-bg" aria-hidden>
      <Image
        src="/images/marketing-cinematic-bg.svg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="home-hero-bg__image"
      />
      <div className="home-hero-bg__gradient" />
      <div className="home-hero-bg__vignette" />
      <div className="home-hero-bg__noise" />
    </div>
  );
}
