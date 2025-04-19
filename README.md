
# passManager - Chrome Extension

passManager is a simple and secure password management and generation tool integrated for your Chrome browser. Built around a Master Password, this extension allows you to:

- Manage Passwords: Store and organize your credentials in a secure environment, accessible only with your Master Password.

- Generate Passwords: Create strong and randomized passwords. 

Developed using HTML, CSS, and JavaScript, passManager operates locally with no external server, ensuring complete control over your data. Enjoy quick installation, an intuitive interface, and simplified protection for your online accounts!

## Purpose

- Help users securely store, organize, and access their credentials with ease.
- Create randomized and complex passwords to boost account security.
- Store data exclusively local(no external servers) for full privacy and control.
- Passwords are encrypted and accessible only via your Master Password, ensuring data remains secure and fully controlled by you.
- Offer a lightweight, user-friendly Chrome extension for quick access and effortless usability.


## installation
1. Clone this repository:
   ```bash
   git clone https://github.com/SerbanPrecup/passManager.git
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer Mode** (top-right)
4. Click **"Load Unpacked"**
5. Select the `passManager` folder from the repository

Your extension should now appear in the toolbar.


## How It Works
**Initial Master Password Setup:** Upon installing passManager, you're prompted to set up a secure Master Password. This password serves as your encryption key using PBKDF2 (Password-Based Key Derivation Function 2) with SHA-256 hashing and 100,000 iterations, ensuring strong protection. Your Master Password encrypts all stored credentials, guaranteeing exclusive access only to you.
<figure align="center">
  <img src="https://github.com/user-attachments/assets/fa2a7a14-d2ee-44d4-8df5-0d7108eeb791" width="400" alt="Master Password Setup Interface">
  <figcaption><em>Master Password Setup Interface</em></figcaption>
</figure>
<figure align="center">
  <img src="https://github.com/user-attachments/assets/3f3cab6c-c46d-491f-84f5-e2528842003a" width="400" alt="Master Password Setup Interface">
  <figcaption><em>Master Password Setup Interface</em></figcaption>
</figure>


---

**Master Password Verification:** Every time the extension popup is activated, you'll be asked to enter your Master Password. The entered password is hashed using SHA-256 and validated against the stored hash. Only upon correct verification will access to your encrypted data be granted.
<figure align="center">
  <img src="https://github.com/user-attachments/assets/1f342eac-fac1-4f46-b9fc-cfa7855d5e30" width="400" alt="Password Verification Screen">
  <figcaption><em>Password Verification Process</em></figcaption>
</figure>

---

**Password Management** 
- **Generate Secure Passwords:** Create strong passwords using a built-in generator, which randomly combines letters, numbers, and special characters to produce secure and unique passwords for your accounts.
<figure align="center">
  <img src="https://github.com/user-attachments/assets/46762bdd-95bb-4997-9204-e3d4cdbcd085" width="600" alt="Password Generator Interface">
  <figcaption><em>Password Generation Feature</em></figcaption>
</figure>

---
- **Add & Encrypt Passwords:** Add credentials for various sites, and each password is encrypted using AES-GCM (Advanced Encryption Standard – Galois/Counter Mode) encryption, providing robust security.
<figure align="center">
  <img src="https://github.com/user-attachments/assets/66172606-5fd4-4f43-b627-efb8ee3234b5" width="600" alt="Password Entry Form">
  <figcaption><em>Credential Encryption Process</em></figcaption>
</figure>

---
- **Modify & Organize Credentials:** Easily edit or categorize your credentials, set favorites for quick access, and efficiently manage your stored passwords.

**Interactive Features:** 
- **Show/Hide Password:** Toggle visibility of individual passwords within the extension for secure viewing. 
- **Copy Passwords:** Quickly copy passwords directly to your clipboard. 
- **Delete Entries:** Remove unwanted credentials with a simple click.
<figure align="center">
  <img src="https://github.com/user-attachments/assets/0f1302dd-4fef-4ee0-bce3-be4cfdf2fde0" width="600" alt="Password Management Interface">
  <figcaption><em>Password Management Controls</em></figcaption>
</figure>

---

**Local Encryption & Storage:** All data is encrypted and stored locally on your device. passManager never communicates with external servers, ensuring complete privacy and data security.
<figure align="center">
  <img src="https://github.com/user-attachments/assets/02c8be01-7812-49d5-8f2f-c9d40d1d1c1f" width="400" alt="Local Storage Diagram">
  <figcaption><em>Local Encryption Architecture</em></figcaption>
</figure>

---

**Quick & Easy Access:** Enjoy instant access to passManager from your Chrome toolbar, offering smooth and intuitive password management whenever needed.

## Requirements

- Google Chrome (latest)
- OS: Windows, macOS, or Linux

## Technologies Used

- **HTML5** (structure, markup)
- **CSS3** (styling, layout)
- **JavaScript (ES6)** (logic, DOM manipulation)
- **Chrome Extension API (Manifest v3)** (permissions, popup behavior)
- **Chrome Storage API** (local data storage)
- **Clipboard API** (copy to clipboard)


## Contact

Feel free to open issues or submit pull requests!

Made with ❤️ to protect you from shady websites.
