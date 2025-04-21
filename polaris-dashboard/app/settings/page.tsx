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
                <button className="toggle-button" onClick={toggleDarkMode}>
                    {darkMode ? "Disable Dark Mode" : "Enable Dark Mode"}
                </button>

                <h2>Update Profile</h2>
                <form className="form-container" onSubmit={handleSubmit}>
                    <label>
            Username:
                        <input 
                            required 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </label>
                    <label>
            Email:
                        <input 
                            required 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </label>

                    {/* Language Selector */}
                    <label>
            Preferred Language:
                        <select className="language-select" value={language} onChange={handleLanguageChange}>
                            <option value="English">English</option>
                            <option value="Spanish">Spanish</option>
                            <option value="French">French</option>
                            <option value="German">German</option>
                            <option value="Chinese">Chinese</option>
                        </select>
                    </label>

                    <button className="save-button" type="submit">Save Changes</button>
                </form>

                {/* Password Change Section */}
                <h2>Change Password</h2>
                <form className="form-container" onSubmit={handlePasswordChange}>
                    <label>
            New Password:
                        <input 
                            required
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </label>
                    <label>
            Confirm Password:
                        <input 
                            required
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </label>
                    <button className="password-button" type="submit">Change Password</button>
                </form>
            </div>
        </div>
    );
}
