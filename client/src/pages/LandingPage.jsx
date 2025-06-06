import React, { useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { City } from "../models/City";
import { FlyingPlane } from "../models/FlyingPlane";
import Swirly from "../components/Swirly";
import Recommendations from '../components/Recommendations';

import { Autocomplete, useLoadScript } from "@react-google-maps/api";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

// nested components (navbar, etc)
import Navbar from "../components/Navbar";
import About from "../components/About";

import {
  leftuparrow,
  leftdownarrow,
  rightuparrow,
  rightdownarrow,
} from "../assets/icons";
import "../index.css";

// Camera side-to-side motion
function CameraOscillator({ radius, polarAngle, amplitude, speed, controlsRef }) {
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    const theta = amplitude * Math.sin(t * speed);

    // Convert spherical coordinates for gentle left-right
    const x = radius * Math.sin(polarAngle) * Math.sin(theta);
    const y = radius * Math.cos(polarAngle);
    const z = radius * Math.sin(polarAngle) * Math.cos(theta);

    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);

    if (controlsRef.current) controlsRef.current.update();
  });
  return null;
}

function CityButton({ city, onSelect, label, style, user }) {
  const navigate = useNavigate();
  const handleClick = () => {
    console.log("User is:", user);
    if (!user) {
      console.log("Redirecting to login...");
      navigate("/login");
    } else {
      console.log(`Navigating to /search?city=${city}`);
      onSelect(city);
    }
  };

  return (
    <motion.div
      className="cursor-pointer select-none"
      onClick={handleClick}
      style={{
        position: "relative",
        padding: "0.75rem 1.25rem",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.2)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1.5px solid rgba(216, 217, 218, 0.25)",
        color: "#222222",
        fontWeight: "600",
        fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        textAlign: "center",
        ...style,
      }}
      whileHover={{
        scale: 1.05,
        background: "rgba(255, 255, 255, 0.35)",
        boxShadow: "0 0 15px rgba(0,0,0,0.15)",
      }}
    >
      {label}
    </motion.div>
  );
}

const promptLogin = () => {
  navigate("/login");
};

export default function LandingPage({ user, setUser }) {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);
  const controlsRef = useRef();
  const [budgetRange, setBudgetRange] = useState([500, 4000]);
  const [commuteRange, setCommuteRange] = useState([0, 120]);
  const [ratingRange, setRatingRange] = useState([0, 5]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  // for landing page search bar

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [autocomplete, setAutocomplete] = useState(null);

  const handlePlaceSelect = () => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    if (!place.formatted_address || !place.geometry) return;

    const formatted = place.formatted_address;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    sessionStorage.setItem(
      "initialSearchState",
      JSON.stringify({
        place: { formatted_address: formatted, lat, lng },
        query: formatted
      })
    );

    navigate(`/search?address=${encodeURIComponent(formatted)}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    sessionStorage.setItem(
      "initialSearchState", JSON.stringify({
        place: null,
        query: searchValue
      })
    );

    navigate(`/search?address=${encodeURIComponent(searchValue)}`);
  };

  const cities = [
    "San Francisco",
    "New York",
    "Seattle",
    "Chicago",
    "Washington D.C.",
    "Los Angeles"
  ];

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
  };

  // Camera + oscillation parameters
  const speed = 0.25;
  const amplitude = 15 * (Math.PI / 180);
  const radius = 11;
  const polarAngle = 1.2;
  const [selectedCity, setSelectedCity] = useState(null);
  const listingsRef = useRef(null);

  const handleCitySelect = (cityName) => {
    setSelectedCity(cityName);
    setSearchValue(cityName);
    setShowDropdown(false);

    window.scrollTo(0, 0);
    navigate(`/search?city=${encodeURIComponent(cityName)}`);
  };

  return (
    <>
      <Navbar user={user} setUser={setUser} />
      <div className="flex">
        <div className="w-full flex pl-40 bg-[#EDEBE4] text-[#4E674A] flex justify-center font-bold" style={{ height: '80vh' }}>
          <Swirly />
          <div className="flex-col w-4/5 pt-20">
            <div className="text-6xl text-left mb-8">
              Woomies
            </div>
            <div className="text-4xl font-semibold mt-4">
              Find your next work roomie
            </div>
            <div className="text-xl font-semibold mt-4 text-[#4E674A]/70">
              Search for stays across San Francisco, NY, Seattle, Chicago, DC, and LA.
            </div>
            {/* search bar */}
            <div className="bg-[#f6f0e8] -ml-1 border-3 rounded-4xl h-16 w-90 mt-8 relative flex items-center px-4">
              {isLoaded ? (
                <Autocomplete
                  onLoad={setAutocomplete}
                  onPlaceChanged={handlePlaceSelect}
                  options={{
                    types: ["address"],
                    componentRestrictions: { country: "us" },
                  }}
                >
                  <form className="w-full" onSubmit={handleSearchSubmit}>
                    <input
                      placeholder="Search for an address"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="w-full p-3 text-lg font-semibold text-[#4E674A]/70 rounded-lg focus:outline-none bg-transparent"
                    />
                  </form>
                </Autocomplete>
              ) : (
                <input
                  placeholder="Loading Maps…"
                  disabled
                  className="w-96 p-3 text-lg font-semibold text-[#4E674A]/70 rounded-lg focus:outline-none bg-transparent"
                />
              )}
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[#4E674A]/50 text-xl ml-10" />
            </div>
          </div>
          <div className="w-20"></div>
          <Canvas camera={{ position: [0, 0, radius], fov: 45 }} shadows>
            <Suspense fallback={null}>
              <ambientLight intensity={1.0} />
            </Suspense>
            <Suspense fallback={null}>
              <Environment preset="sunset" background={false} />
            </Suspense>

            <OrbitControls
              ref={controlsRef}
              enableZoom={false}
              minAzimuthAngle={-amplitude}
              maxAzimuthAngle={amplitude}
              maxPolarAngle={Math.PI / 2 + 0.2}
              minPolarAngle={Math.PI / 2 - 0.3}
            />

            <Suspense fallback={null}>
              <City scale={[0.8, 1, 1]} position={[0.5, 0.8, -1]} />
            </Suspense>

            <Suspense fallback={null}>
              <FlyingPlane />
            </Suspense>

            {/* Contact shadow to ground the city */}
            <ContactShadows
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, -0.2, 0]}
              opacity={0.6}
              width={10}
              height={10}
              blur={1.5}
              far={2}
            />

            {/* camera oscillation */}
            <CameraOscillator
              radius={radius}
              polarAngle={polarAngle}
              amplitude={amplitude}
              speed={speed}
              controlsRef={controlsRef}
            />
          </Canvas>
        </div>
      </div>
      <About />
      {user && <Recommendations user={user} />}
      <footer className="bg-[#EDEBE4] text-[#4E674A] text-sm text-center py-4">
        <p>&copy; 2025 Woomies. All rights reserved.</p>
      </footer>
    </>
  );
}