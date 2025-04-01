"use client";

import React, { useState } from "react";
import "@/app/settings/settings.css"; 
import Sidebar from "@/components/sidebar/sidebar";

export default function MyDataPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [username, setUsername] = useState("Amitesh"); 
  const [email, setEmail] = useState("amitesh@example.com"); 
  const [language, setLanguage] = useState("English");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
    document.body.classList.toggle("dark-mode");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Username: ${username}, Email: ${email}, Language: ${language}`);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword === confirmPassword) {
      alert("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      alert("Passwords do not match. Please try again.");
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  return (
    <div className="page-container">
      <Sidebar />
      <div className="content">
        <h1>Settings Page</h1>
        <button onClick={toggleDarkMode} className="toggle-button">
          {darkMode ? "Disable Dark Mode" : "Enable Dark Mode"}
        </button>

        <h2>Update Profile</h2>
        <form onSubmit={handleSubmit} className="form-container">
          <label>
            Username:
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required
            />
          </label>
          <label>
            Email:
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
          </label>

          {/* Language Selector */}
          <label>
            Preferred Language:
            <select value={language} onChange={handleLanguageChange} className="language-select">
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Chinese">Chinese</option>
            </select>
          </label>

          <button type="submit" className="save-button">Save Changes</button>
        </form>

        {/* Password Change Section */}
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordChange} className="form-container">
          <label>
            New Password:
            <input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          <label>
            Confirm Password:
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="password-button">Change Password</button>
        </form>
      </div>
    </div>
  );
}
