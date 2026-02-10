"use client";
import { Copy, Search } from "lucide-react";
import { useState } from "react";

const Landing = () => {
  const [step, setStep] = useState(1);
  const [myEmail, setMyEmail] = useState("");
  const [myName, setMyName] = useState("");
  const [hisHerName, setHisHerName] = useState("");
  const [hisHerOtherName, setHisHerOtherName] = useState("");
  const [mediaTypes, setMediaTypes] = useState(["", "", "", ""]);
  const [mediaFiles, setMediaFiles] = useState([null, null, null, null]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState("");
  const [webLink, setWebLink] = useState("");
  const [results, setResults] = useState([]);

  const generate = () => {
    setStep(2);
  };

  const searchLink = async () => {
    if (!myEmail.trim()) {
      setError("Enter your email first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `/api/search-links?email=${encodeURIComponent(myEmail.trim())}`,
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Search failed");
      }

      setResults(data.links || []);
      setStep(5);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (index, value) => {
    const updated = [...mediaTypes];
    updated[index] = value;
    setMediaTypes(updated);
    const filesUpdated = [...mediaFiles];
    filesUpdated[index] = null;
    setMediaFiles(filesUpdated);
  };

  const handleFileChange = (index, file) => {
    const updated = [...mediaFiles];
    updated[index] = file;
    setMediaFiles(updated);
  };
  const isError = "*" + error;
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const uploadToCloudinary = async (file, type) => {
    try {
      setLoading(true);
      if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error(
          "Cloudinary env vars missing (cloud name / upload preset).",
        );
      }

      if (!file) {
        throw new Error("No file provided.");
      }

      // Hard limits (don’t get cooked by abuse)
      const maxImageBytes = 5 * 1024 * 1024; // 5MB
      const maxVideoBytes = 20 * 1024 * 1024; // 20MB

      if (type === "image" && file.size > maxImageBytes) {
        throw new Error("Image too large. Max 5MB.");
      }

      if (type === "video" && file.size > maxVideoBytes) {
        throw new Error("Video too large. Max 20MB.");
      }

      if (!["image", "video"].includes(type)) {
        throw new Error("Invalid media type.");
      }

      const resourceType = type === "video" ? "video" : "image";

      const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      fd.append("folder", "valentine-sites");

      const res = await fetch(endpoint, {
        method: "POST",
        body: fd,
      });

      let data;

      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid response from Cloudinary.");
      }

      if (!res.ok) {
        throw new Error(data?.error?.message || "Cloudinary upload failed.");
      }

      if (!data?.secure_url) {
        throw new Error("Upload succeeded but no URL returned.");
      }

      return data.secure_url; // Always use https
    } catch (err) {
      setLoading(false);
      console.error("Cloudinary Upload Error:", err);

      // Re-throw clean error for UI
      throw new Error(err?.message || "File upload failed. Try again.");
    }
  };

  const generateWeb = async () => {
    setLoading(true);
    setError("");
    setSavedId("");
    setWebLink("");

    // Ruthless validation: don’t send trash
    if (!myEmail.trim() || !myName.trim()) {
      setError("Your email and your name are required.");
      setLoading(false);
      return;
    }
    if (!hisHerName.trim() || !hisHerOtherName.trim()) {
      setError("His/Her name is required.");
      setLoading(false);
      return;
    }
    const hasAllMedia = mediaFiles.every((f) => f !== null);

    if (!hasAllMedia) {
      setError("Kindly upload all 4 images/videos.");
      setLoading(false);
      return;
    }
    const capitalize = (str) => {
      if (!str) return "";
      const clean = str.trim().toLowerCase();
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    };

    const urlLink = `${hisHerName}-${hisHerOtherName}`
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9-_]/g, "");
    const uploadedUrls = await Promise.all(
      mediaFiles.map((file, i) => uploadToCloudinary(file, mediaTypes[i])),
    );
    const payload = {
      id: null,
      name: capitalize(myName),
      email: myEmail.trim(),
      links: [
        {
          id: urlLink,
          name: capitalize(hisHerName),
          secName: capitalize(hisHerOtherName),
          url: urlLink,
          why: [
            "Your smile lights up my whole world, even through a screen",
            "You make every call feel like we're right next to each other",
            "Your voice is my favorite sound, {name}",
            "You understand me like no one else, {secName}",
            "Talking to you feels like home",
            "You make the distance worth every second",
          ],
          pictures: mediaTypes.map((t, idx) => ({
            type: t,
            link: uploadedUrls[idx], // ✅ actual media URL
          })),
          createdAt: new Date().toISOString(),
        },
      ],
    };

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/generated-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      console.log("STATUS:", res.status);
      console.log("RAW RESPONSE:", text.slice(0, 500));

      if (!res.ok) {
        throw new Error(
          `API failed (${res.status}). Check console for raw error.`,
        );
      }

      const data = JSON.parse(text);
      // Firestore returns: { id: "abc123", slug: "john-doe" } (if you return it)
      setSavedId(data.id || "");
      setWebLink(data.slug);
      setStep(3);
    } catch (e) {
      setLoading(false);
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex m-2 relative items-center focus:outline-none justify-center min-h-screen">
        {step == 1 && (
          <div className="flex px-5 items-center justify-center min-h-screen">
            <div className="backdrop-blur-sm shadow-lg bg-white/20 border border-white/20 rounded-3xl p-7.5">
              <div className="grid justify-items-center">
                <div className="font-bold text-xl sm:text-3xl max-w-100 pt-4">
                  <div className="text-center pb-3">
                    Welcome to Valentine Message Generator 💌
                  </div>
                </div>
                <div className="pt-2 text-center text-sm text-red-900/80">
                  <div className=" max-w-100">
                    A place where you can create a beautiful website to ask your
                    loved one to be your Valentine in a special and
                    unforgettable way. 💖
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={generate}
                      className="flex items-center justify-center gap-2 border-red-900/30 hover:scale-102 duration-500 text-red-600 bg-red-100/60 border py-2 px-5 rounded-3xl"
                    >
                      💖 <span>Start Generating</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="flex items-center justify-center gap-2 border-red-900/30 hover:scale-102 duration-500 text-red-600 bg-red-100/60 border py-2 px-5 rounded-3xl"
                    >
                      <Search size={14} />
                      <span>Find link</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-center pt-5 tracking-widest font-semibold uppercase text-gray-900">
                    Created by Modred.dev
                  </p>
                </div>{" "}
              </div>
            </div>
          </div>
        )}
        {step == 2 && (
          <div>
            <div className="flex px-5 items-center justify-center min-h-screen">
              <div className="backdrop-blur-sm shadow-lg bg-white/20 border border-white/20 rounded-3xl p-7.5">
                <div className="grid justify-items-center">
                  <div className="font-bold text-xl sm:text-2xl pt-4">
                    <div className="text-center max-w-100">
                      Enter the following details to start generating
                    </div>
                  </div>
                  <div className="pt-2 text-sm text-red-900/80">
                    <form
                      className={
                        loading ? "pointer-events-none opacity-80" : ""
                      }
                    >
                      <div className="grid sm:grid-cols-2 gap-4 mt-3">
                        <div className="">
                          <label className="sm:col-span-2 text-sm">
                            Your Name
                          </label>
                          <input
                            type="name"
                            name="name"
                            onChange={(e) => setMyName(e.target.value)}
                            id="name"
                            className="bg-gray-200  w-full text-black border focus:border-0 border-red-600/50 rounded-md mt-1 py-2 px-3"
                            placeholder="Daniel"
                            required
                            disabled={loading}
                          />
                        </div>
                        <div className="">
                          <label className="sm:col-span-2 text-sm">
                            Your Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            disabled={loading}
                            onChange={(e) => setMyEmail(e.target.value)}
                            id="email"
                            className="bg-gray-200  w-full text-black border focus:border-0 border-red-600/50 rounded-md mt-1 py-2 px-3"
                            placeholder="the_generator@gmail.com"
                            required
                          />
                        </div>

                        <div className="">
                          <label className="sm:col-span-2 text-sm">
                            His/Her name
                          </label>
                          <input
                            name="name"
                            onChange={(e) => setHisHerName(e.target.value)}
                            id="name"
                            className="bg-gray-200  w-full text-black border focus:border-0 border-red-600/50  rounded-md mt-1 py-2 px-3"
                            placeholder="John"
                            required
                            disabled={loading}
                          />
                        </div>
                        <div className="">
                          <label className="sm:col-span-2">
                            His/Her other name
                          </label>
                          <input
                            name="othername"
                            id="othername"
                            disabled={loading}
                            onChange={(e) => setHisHerOtherName(e.target.value)}
                            className="bg-gray-200  h-9.25  w-full text-black border focus:border-0 border-red-600/50  rounded-md mt-1 py-2 px-3"
                            placeholder="Doe"
                            required
                          />
                        </div>
                        <div></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="space-y-3">
                            {/* Label */}
                            <label className="text-sm font-medium">
                              Media {i + 1}
                            </label>

                            {/* Select */}
                            <select
                              value={mediaTypes[i]}
                              onChange={(e) =>
                                handleTypeChange(i, e.target.value)
                              }
                              disabled={loading}
                              className="w-full mt-1 text-black bg-gray-200 border h-10 border-red-600/50 rounded-md px-3 focus:outline-none"
                            >
                              <option value="">Select media type</option>
                              <option value="image">Photo</option>
                              <option value="video">Video</option>
                            </select>

                            {/* Upload */}
                            {mediaTypes[i] && (
                              <div>
                                <label className="text-sm">
                                  Upload {mediaTypes[i]}
                                </label>

                                <input
                                  type="file"
                                  accept={
                                    mediaTypes[i] === "image"
                                      ? "image/*"
                                      : "video/*"
                                  }
                                  disabled={loading}
                                  onChange={(e) =>
                                    handleFileChange(i, e.target.files?.[0])
                                  }
                                  required
                                  className="mt-1 w-full text-black bg-gray-100 border border-gray-300 rounded-md px-2 py-1 text-sm
              file:mr-3 file:border-0 file:bg-red-500 file:text-white file:px-3 file:py-1 file:rounded-md"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md">
                        {!!error && (
                          <div className="flex justify-center gap-3 bg-rose-600/95 backdrop-blur-md shadow-2xl rounded-2xl px-4 py-3 text-rose-50 animate-slideDown">
                            {/* Icon */}
                            <span className="text-lg leading-none">⚠️</span>

                            {/* Text */}
                            <p className="text-sm font-bold leading-snug">
                              {isError}
                            </p>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={generateWeb}
                        disabled={loading}
                        className="mx-auto flex items-center justify-center gap-2 border border-red-900/30 hover:scale-103 transition-transform duration-300 text-red-600 mt-5 bg-red-100/60 py-2.5 px-6 rounded-3xl font-medium"
                      >
                        {loading ? "Generating..." : "💖 Start Generating"}
                      </button>
                    </form>
                  </div>{" "}
                </div>
              </div>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="text-center grid gap-0 place-items-center backdrop-blur-sm shadow-lg bg-white/20 border  border-white/20 rounded-3xl p-7.5">
            <div className="text-xl font-bold">Generated ✅</div>
            <div className="text-m mt-2 opacity-80">
              <span>Website at: </span>
              <a
                className="underline text-rose-900 font-bold"
                href={`/v/${webLink}`}
                target="_blank"
                rel="noreferrer"
              >
                {`https://hehe-hmm.netlify.app/v/${webLink}`}
              </a>
              <span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `https://hehe-hmm.netlify.app/v/${webLink}`,
                      );

                      alert("Link copied ✅"); // optional feedback
                    } catch (err) {
                      console.error("Copy failed:", err);
                      alert("Failed to copy ❌");
                    }
                  }}
                  className="px-1 py-1 mx-2 bg-white border hover:bg-gray-100 active:scale-95 transition"
                >
                  <Copy size={12} />
                </button>
              </span>
              <p className="pt-3">
                Send it to them and make them feel special and loved.
              </p>
              <p>
                You’ll get an email notification immediately after they say
                “Yes.”
              </p>
            </div>
          </div>
        )}
        {step == 4 && (
          <div className="flex px-5 items-center justify-center min-h-screen">
            <div className="backdrop-blur-sm shadow-lg bg-white/20 border border-white/20 rounded-3xl p-7.5">
              <div className="grid justify-items-center">
                <p className="font-bold pb-2 mb-2 text-xl max-w-70 text-center">
                  Check all the links associated with your email
                </p>
                <form
                  className={loading ? "pointer-events-none opacity-60" : ""}
                >
                  <div className="">
                    <label className="sm:col-span-2 text-sm">Your Email</label>
                    <input
                      type="email"
                      name="email"
                      disabled={loading}
                      onChange={(e) => setMyEmail(e.target.value)}
                      id="email"
                      className="bg-gray-200  w-full text-black border focus:border-0 border-red-600/50 rounded-md mt-1 py-2 px-3"
                      placeholder="the_generator@gmail.com"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={searchLink}
                    disabled={loading}
                    className="mx-auto flex items-center justify-center gap-2 border border-red-900/30 hover:scale-103 transition-transform duration-300 text-red-600 mt-5 text-sm bg-red-100/60 py-2.5 px-6 rounded-3xl font-medium"
                  >
                    {loading ? "Searching..." : "Start Search"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        {step == 5 && (
          <div>
            {results.length > 0 ? (
              <div className="flex px-5 mt-20 items-center justify-center min-h-screen">
                <div className="backdrop-blur-sm shadow-lg bg-white/20 border border-white/20 rounded-3xl p-7.5">
                  <div className="grid justify-items-center">
                    <div className="space-y-3 w-full max-w-md">
                      <h3 className="font-bold text-lg">
                        Your Generated Links
                      </h3>

                      {results.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl min-w-70 border bg-white/60 shadow-sm"
                        >
                          <p className="text-sm font-semibold">
                            {item.links?.[0]?.name} {item.links?.[0]?.secName}
                          </p>

                          <a
                            href={`/v/${item.slug}`}
                            target="_blank"
                            className="text-rose-700 underline text-sm"
                          >
                            /v/{item.slug}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex px-5 items-center min-w-70 justify-center min-h-screen">
                <div className="backdrop-blur-sm shadow-lg bg-white/20 border border-white/20 rounded-3xl p-7.5">
                  <div className="grid justify-items-center">
                    <p className="font-bold text-center">
                      We couldn’t find any links associated with this email.
                    </p>
                  </div>{" "}
                </div>{" "}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
export default Landing;
