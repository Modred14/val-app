"use client";

import { useEffect, useRef, useState } from "react";
import LoveBackground from "../../LoveBackground";
import { Clock, Heart, Star, Stars } from "lucide-react";
import ValentineCountdown from "../../ValentineCountdown";

const Home = ({ data }) => {
  const audioRef = useRef(null);

  const [step, setStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");
  const [asking, setAsking] = useState(true);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [yesScale, setYesScale] = useState(1);
  const [hover, setHover] = useState(0);
  const [count, setCount] = useState(0);
  const [currentMsg, setCurrentMsg] = useState("");
  const [mediaLoading, setMediaLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [mediaList, setMediaList] = useState([]);

  const moveNo = () => {
    const x = Math.random() * 160 - 80;
    const y = Math.random() * 100 - 50;
    setHover((prev) => prev + 1);
    pickRejectMessage();
    setNoPos({ x, y });
  };

  const handleReject = () => {
    setYesScale((prev) => prev + 0.1);
    setCount((prev) => prev + 1);
    moveNo();
  };

  const rejectMesssage = [
    "Think again {name}...",
    "Last chance, beautiful 😌",
    "Okay, one more chance {secName}...",

    "I know you love me, {name} 😏",
    "Stop playing hard to get, {secName}",
    "This button is lying, click YES 😤",

    "Please don’t say no, my favorite person 🥺",
    "Don't do this to me, {name} 😩",
    "You are breaking my heart 💔",

    "Wrong choice, try again 😂",
    "System error: NO not allowed 🚫",

    "I refuse to accept this answer 😌",
  ];
  const pickRejectMessage = () => {
    const random =
      rejectMesssage[Math.floor(Math.random() * rejectMesssage.length)];

    setCurrentMsg(
      random.replace("{name}", user.name).replace("{secName}", user.secName),
    );
  };

  const handleValButton = async () => {
    setAsking(false);
    const emailMessage = `${user.name} finally said YES after hovering over the “No” button ${hover} times and clicking it ${count} times.`;
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: owner.email, // 👈 receiver
          name: owner.name,
          message: emailMessage,
        }),
      });
      console.log("Sent");
    } catch (err) {
      console.error("Email failed:", err);
    }
  };
  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      setError("");

      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch (e) {
      setIsPlaying(false);
      setError(
        "Audio couldn't play. Check the file link or browser autoplay rules.",
      );
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = async () => {
      audio.currentTime = 0;
      try {
        const p = audio.play();
        if (p && typeof p.then === "function") await p;
        setIsPlaying(true);
      } catch (err) {
        setIsPlaying(false);
        console.log("Autoplay blocked on ended:", err);
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const startSurpise = async () => {
    setStep(2);
    setTimeout(async () => {
      const audio = audioRef.current;
      console.log("audioRef:", audio);

      if (!audio) return;

      try {
        audio.currentTime = 0;
        await audio.play();
        setIsPlaying(true);
      } catch (e) {
        console.error("Play failed:", e);
      }
    }, 0);
  };
  const owner = data?.owner;
  const user = data?.link;

  useEffect(() => {
    const list = user?.pictures || [];
    setMediaList(list);

    // If no media, don't block the page
    if (list.length === 0) {
      setMediaLoading(false);
      return;
    }

    let cancelled = false;
    setMediaLoading(true);

    const timeout = (ms) =>
      new Promise((resolve) => setTimeout(() => resolve("timeout"), ms));

    const preloadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve("ok");
        img.onerror = () => resolve("error");
        img.src = src;
      });

    const preloadVideo = (src) =>
      new Promise((resolve) => {
        const video = document.createElement("video");
        video.preload = "auto";
        video.muted = true; // helps some browsers
        video.playsInline = true;

        const done = (status) => {
          cleanup();
          resolve(status);
        };

        const cleanup = () => {
          video.removeEventListener("loadeddata", onLoaded);
          video.removeEventListener("error", onError);
          // stop any network usage
          video.src = "";
          video.load();
        };

        const onLoaded = () => done("ok");
        const onError = () => done("error");

        video.addEventListener("loadeddata", onLoaded);
        video.addEventListener("error", onError);

        video.src = src;
        video.load();
      });

    (async () => {
      const loaders = list.map((m) => {
        const load =
          m.type === "video" ? preloadVideo(m.link) : preloadImage(m.link);

        // hard stop per item so one bad link doesn't hold your site hostage
        return Promise.race([load, timeout(12000)]);
      });

      await Promise.all(loaders);

      if (!cancelled) setMediaLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex relative items-center justify-center min-h-screen">
      <div className=" ">
        <LoveBackground />
      </div>
      {step == 1 && (
        <div className="flex px-5 items-center justify-center min-h-screen">
          <div className="backdrop-blur-sm shadow-lg bg-white/20 border border-white/20 rounded-3xl p-7.5">
            <div className="grid justify-items-center">
              <div className="pulsescale">
                <img
                  // src="https://pngimg.com/uploads/heart/heart_PNG51339.png"
                  src="/love-white.png"
                  alt="love"
                  className=" p-4 bg-red-500/90 w-20 border border-red-900/80 rounded-full"
                />
              </div>
              <div className="font-bold text-xl sm:text-2xl pt-4">
                Hi {user.name} 💕
              </div>
              <div className="pt-2 text-center text-sm text-red-900/80">
                <div className=" max-w-100">
                  I made something special for you, Tap the button below to see
                  what I've been working on...😊{" "}
                </div>
                <button
                  onClick={startSurpise}
                  className="border-red-900/30 hover:scale-102 duration-500 text-red-600 mt-5 bg-red-100/60 border py-2 px-5 rounded-3xl"
                >
                  ▶ Tap to Begin
                </button>
                <p className="mt-3 text-gray-800/40 text-[12px] font-medium">
                  ~ Me & U by Tems ~
                </p>
                <p className="text-[11px]  text-gray-800/50 text-center mt-5 tracking-widest font-semibold uppercase ">
                  Generated by Modred.dev
                </p>
              </div>{" "}
            </div>
          </div>
        </div>
      )}
      {step == 2 && (
        <div className="px-5 max-w-200">
          <div className=" flex justify-center items-center min-h-screen">
            <div className=" backdrop-blur-sm shadow-lg bg-white/20 border border-white/20 rounded-3xl p-7.5">
              <div className=" grid place-items-center">
                <p className="flex text-center place-items-center text-sm gap-2 text-yellow-900/90">
                  <Stars size={15} />
                  <p>A SPECIAL MESSAGE FOR YOU</p>
                  <Stars size={15} />
                </p>
                <p className="text-3xl pt-3 sm:text-5xl font-bold">
                  Hi
                  <span className="text-red-700"> {user.name}...</span> 💕
                </p>

                <p className="text-center pt-3 max-w-150 text-[18px]">
                  Even though miles separate us, {user.secName}, I couldn't wait
                  any longer to ask you something special...
                </p>
                <p className="text-center pt-3 text-[15px] text-gray-800">
                  Scroll down to see what's on my heart, {user.name}🥺
                </p>
                <p className="pt-6 duration-1000 animate-bounce text-red-700">
                  <Heart size={20} />
                </p>
              </div>
            </div>
          </div>
          <div className=" shadow-lg backdrop-blur-sm bg-white/20 border border-white/20 rounded-3xl p-7.5">
            <div className=" grid place-items-center">
              {" "}
              <div className="flex items-center justify-center gap-2 text-sm text-center">
                <Clock size={15} color="red" />
                <span>COUNTING DOWN TO</span>
                <Clock size={15} color="red" />
              </div>
              <p className="pt-3 text-2xl text-center font-bold">
                Our Special Day, {user.name}{" "}
                <span className="animate-pulse">❤️</span>
              </p>
              <p className="text-center pt-2 text-sm text-gray-800">
                Every second without you, {user.name}, feels like forever... but
                knowing Valentine's Day is coming makes my heart race 💕
              </p>
              <div className="py-6">
                <ValentineCountdown />
              </div>
              <p className="text-center animate-soft-bounce linear text-red-800">
                "Counting down until I can finally hold you, {user.name} 💕"
              </p>
            </div>{" "}
          </div>
          <div className="mt-10 shadow-lg backdrop-blur-sm bg-white/20 border border-white/20 rounded-3xl p-7.5">
            <div className="bg-gray-200 p-5 rounded-2xl shadow-sm">
              <div>
                <span className="text-red-900">
                  From the moment you came into my life, everything started
                  feeling different in the best way. The way you laugh, the way
                  you care, and the way you make every conversation special
                  means more to me than you know, {user.secName}.
                </span>

                <br />
                <br />

                <span className="text-red-900">
                  I won’t lie, I really enjoy having you in my life. You bring
                  peace, smiles, and a kind of happiness that’s rare. Being
                  close to you, even just by talking, always makes my day
                  better.
                </span>

                <br />
                <br />

                <span className="text-red-900">
                  This Valentine’s Day, I just want you to know that you are
                  special to me, and I’m grateful for everything we’re building
                  together, step by step… no rush, no pressure. 💕
                </span>

                <br />
                <br />

                <span className="text-red-600 font-medium text-xl">
                  Always thinking of you,
                </span>
                <br />
                <span className="text-red-600 font-medium text-2xl">
                  Your biggest fan 🤍
                </span>
              </div>
            </div>
          </div>
          <div className="bg-gray-200 shadow-lg rounded-3xl mt-10 p-7.5">
            <p className="text-center pb-3 font-bold text-2xl sm:text-3xl text-red-600">
              Why I Love You ✨
            </p>
            {(user.why ?? []).map((text, i) => {
              const finalText = text
                .replace("{name}", user.name)
                .replace("{secName}", user.secName);
              let icon = "nothing";
              if (i % 3 === 0) {
                icon = <Heart size={19} />;
              } else if (i % 3 === 1) {
                icon = <Star size={19} />;
              } else {
                icon = <Stars size={19} />;
              }
              return (
                <>
                  <div className="flex bg-gray-100 mt-3 p-3 rounded-xl gap-2.5 items-center">
                    <span className="p-2 bg-red-200 rounded-[50%] text-red-600">
                      {icon}
                    </span>
                    <span key={i} className="text-sm">
                      {finalText}
                    </span>
                  </div>
                </>
              );
            })}
          </div>
          <div className="mt-10 shadow-lg backdrop-blur-sm bg-white/20 border border-white/20 rounded-3xl p-7.5">
            <div className=" grid place-items-center">
              <p className="text-center text-3xl text-red-600">
                My Favorite Views of You 💕
              </p>
              <p className="text-center pt-3">
                Even from miles away, you're the most beautiful sight...
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-7">
              {mediaLoading && (
                <div className="col-span-2 w-full min-h-28 grid place-items-center">
                  <div className="flex flex-col items-center gap-3">
                    {/* Hearts Loader */}
                    <div className="flex gap-2">
                      <span className="heart-loader">❤️</span>
                      <span className="heart-loader">💖</span>
                      <span className="heart-loader">💗</span>
                    </div>

                    {/* Text */}
                    <p className="text-sm font-bold animate-pulse text-gray-700 text-center">
                      Please wait... Loading memories... 💕
                    </p>
                  </div>
                </div>
              )}

              {!mediaLoading &&
                mediaList.map((media, i) => {
                  return (
                    <div
                      key={i}
                      className="overflow-hidden aspect-square rounded-2xl"
                    >
                      {media.type == "video" ? (
                        <video
                          src={media.link}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={media.link}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  );
                })}
            </div>
            <p className="text-center text-[13px] mt-3">
              Missing you always 💕
            </p>
          </div>
          <div className="grid place-items-center py-3 text-center backdrop-blur-xs mt-20">
            {asking ? (
              <div>
                <div className="grid place-items-center">
                  <Heart
                    size={50}
                    className="fill-red-400 text-red-700 pulsescale"
                  />
                </div>
                <p className="text-3xl mt-3  text-red-800">
                  Will you be my Valentine?
                </p>
                <p className="text-gray-800 mt-2 text-sm text-center px-2 pb-2">
                  {hover ? currentMsg : "I've been waiting to ask you this..."}
                </p>
                <div className=" max-w-screen grid gap-3 grid-cols-2 mt-7">
                  <button
                    onClick={handleValButton}
                    style={{
                      transform: `scale(${yesScale})`,
                    }}
                    className="bg-red-800 hover:scale-103 duration-250 shadow-xl text-gray-200 font-extrabold px-10 py-2 rounded-2xl border border-red-700/90"
                  >
                    Yes 💕
                  </button>
                  <button
                    onMouseEnter={moveNo}
                    onTouchStart={moveNo}
                    onClick={handleReject}
                    style={{
                      transform: `translate(${noPos.x}px, ${noPos.y}px)`,
                    }}
                    className="bg-gray-200 hover:scale-103 duration-250 shadow-xl font-extrabold px-10 py-2 rounded-2xl border border-red-600/90"
                  >
                    No 😭
                  </button>
                </div>
                {hover > 2 && (
                  <div className="pt-10 text-xs">
                    (The 'No' button seems to have a mind of its own 😏)
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="grid place-items-center">
                  <Heart
                    size={50}
                    className="fill-red-700 text-red-700 pulsescale"
                  />
                </div>
                <p className="text-3xl py-4 px-2">
                  Yay! I Love You, {user.name} 💕
                </p>
                <p className="text-center">
                  I knew you’d say yes, {user.secName} 😊. You just made my day.
                  I’m really excited about Valentine’s with you, even with the
                  distance. 🌹
                </p>
              </div>
            )}
          </div>
          <hr className="mt-15 text-red-700/30" />
          <div className="pt-7 grid place-items-center">
            <p className="flex text-gray-700 text-sm items-center gap-2">
              Made with{" "}
              <span className="">
                <Heart
                  size={15}
                  className="fill-red-700 text-red-700 pulsescale"
                />
              </span>{" "}
              just for you
            </p>
          </div>
          <p className="text-[11px] text-center mt-10 mb-5 tracking-widest font-semibold uppercase text-gray-800/50">
            Generated by Modred.dev
          </p>
          <div className="fixed bottom-6 -left-4  w-full">
            <div id="audio" className="z-100 flex  justify-end">
              <audio ref={audioRef} src="/me-and-u.mp3" preload="auto" loop />
              <div className="bg-red-200 grid grid-cols-2 border border-red-900/40 shadow-2xl px-2 py-2 rounded-2xl items-center">
                <button
                  onClick={togglePlay}
                  className="text-[12px] rounded-[50%] hover:scale-105 duration-300 text-white"
                >
                  {" "}
                  <div className="py-1 px-2 w-fit rounded-xl bg-red-600/60 border-red-200/80 border">
                    {isPlaying ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    )}
                  </div>
                </button>
                <button className="text-[12px] rounded-[50%] duration-300 text-white">
                  <div className="py-1 px-2 w-fit  rounded-xl  border border-red-200/80">
                    <div
                      className={`eq ${isPlaying ? "eq--play" : "eq--pause"}`}
                    >
                      <span className="eq__bar" />
                      <span className="eq__bar" />
                      <span className="eq__bar" />
                      <span className="eq__bar" />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Home;
