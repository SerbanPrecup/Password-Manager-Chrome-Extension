document.addEventListener('DOMContentLoaded', () => {
    let cryptoKey = null;

    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (const b of bytes) binary += String.fromCharCode(b);
        return btoa(binary);
    }

    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async function deriveKey(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            enc.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    async function encryptText(text) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const encoded = enc.encode(text);
        const cipherBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            encoded
        );
        return {
            iv: arrayBufferToBase64(iv),
            cipher: arrayBufferToBase64(cipherBuffer)
        };
    }

    async function decryptText(cipherBase64, ivBase64) {
        const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
        const cipherBuffer = base64ToArrayBuffer(cipherBase64);
        const plainBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            cipherBuffer
        );
        const dec = new TextDecoder();
        return dec.decode(plainBuffer);
    }

    const setContainer = document.getElementById('setMasterContainer');
    const mainContainer = document.getElementById('mainContainer');
    const masterInput = document.getElementById('masterPassword');
    const confirmInput = document.getElementById('confirmMasterPassword');
    const saveMasterBtn = document.getElementById('saveMasterBtn');
    const cancelMasterBtn = document.getElementById('cancelMasterBtn');

    document.querySelectorAll('.toggle-password-input').forEach(btn => {
        btn.addEventListener('click', () => {
            const inp = btn.previousElementSibling;
            inp.type = inp.type === 'password' ? 'text' : 'password';
        });
    });

    chrome.storage.local.get('masterHash', data => {
        if (!data.masterHash) showSet();
        else showMain();
    });

    saveMasterBtn.addEventListener('click', async () => {
        const pwd = masterInput.value;
        const confirm = confirmInput.value;
        if (!pwd || pwd !== confirm) return alert('Passwords do not match or are empty.');

        const saltArr = crypto.getRandomValues(new Uint8Array(16));
        const saltStr = arrayBufferToBase64(saltArr);
        cryptoKey = await deriveKey(pwd, saltArr);

        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd));
        const hash = Array.from(new Uint8Array(buf))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        chrome.storage.local.set({ masterHash: hash, salt: saltStr }, () => {
            alert('Master Password successfully set!');
            showMain();
        });
    });

    cancelMasterBtn.addEventListener('click', () => window.close());

    function showSet() {
        setContainer.classList.remove('hidden');
        mainContainer.classList.add('hidden');
    }

    function showMain() {
        setContainer.classList.add('hidden');
        mainContainer.classList.remove('hidden');
        promptMaster().then(initMain);
    }

    function promptMaster() {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.id = 'passwordPrompt';
            overlay.classList.add('show');
            overlay.innerHTML = `
            <div class="password-prompt-title">Master Password</div>
            <input type="password" id="promptMasterInput" placeholder="Master Password" style="width:100%;padding:8px;margin-top:8px;" />
            <div class="password-prompt-actions">
              <button class="btn-confirm btn primary">Confirm</button>
            </div>`;
            document.body.appendChild(overlay);
            overlay.querySelector('.btn-confirm').addEventListener('click', async () => {
                const val = document.getElementById('promptMasterInput').value;
                const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(val));
                const hex = Array.from(new Uint8Array(buf))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
                chrome.storage.local.get(['masterHash', 'salt'], async data => {
                    if (data.masterHash === hex) {
                        const saltBuf = base64ToArrayBuffer(data.salt);
                        cryptoKey = await deriveKey(val, new Uint8Array(saltBuf));
                        overlay.remove();
                        resolve();
                    } else {
                        alert('Incorrect password!');
                    }
                });
            });
        });
    }
    let currentSite = '';
    function initMain() {
        const generateBtn = document.getElementById('generateBtn');
        const genInput = document.getElementById('generatedPassword');
        const copyBtn = document.getElementById('copyBtn');
        const addBtn = document.getElementById('addAccountBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const deleteAllBtn = document.getElementById('deleteAllBtn');
        const editMasterBtn = document.getElementById('editMasterBtn');
        const addForm = document.getElementById('addForm');
        const cancelFormBtn = document.getElementById('cancelEdit');
        const saveFormBtn = document.getElementById('savePassword');
        const deleteFormBtn = document.getElementById('deletePassword');
        const accountsList = document.getElementById('accountsList');
        const filterButtons = document.querySelectorAll('.filter-buttons button');
        const searchInput = document.getElementById('searchAccount');

        let editIdx = null;
        let filterType = 'ALL';

        let searchQuery = '';

        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs.length && tabs[0].url) {
                try {
                    const url = new URL(tabs[0].url);
                    currentSite = url.hostname.replace(/^www\./, '').toLowerCase();
                } catch (e) {
                    console.error('URL parsing failed:', e);
                    currentSite = '';
                }
            }
            loadAccounts();
        });

        filterButtons.forEach(btn => {
            btn.addEventListener('click', e => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                filterType = e.currentTarget.textContent.trim().toUpperCase();
                loadAccounts();
            });
        });
        searchInput.addEventListener('input', e => {
            searchQuery = e.target.value.trim().toLowerCase();
            loadAccounts();
        });

        generateBtn.addEventListener('click', () => {
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
            let pwd = '';
            for (let i = 0; i < 16; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
            genInput.value = pwd;
        });
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(genInput.value);
            alert('Password copied!');
        });

        disconnectBtn.addEventListener('click', () => location.reload());
        deleteAllBtn.addEventListener('click', () => {
            if (confirm('Delete all data?')) chrome.storage.local.remove(['accounts', 'masterHash', 'salt'], () => location.reload());
        });

        const editForm = document.getElementById('editMasterForm');
        const saveNewMasterBtn = document.getElementById('saveNewMasterBtn');
        const cancelNewMasterBtn = document.getElementById('cancelNewMasterBtn');

        editMasterBtn.addEventListener('click', () => editForm.classList.remove('hidden'));
        cancelNewMasterBtn.addEventListener('click', () => editForm.classList.add('hidden'));

        saveNewMasterBtn.addEventListener('click', async () => {
            const current = document.getElementById('currentMaster').value;
            const nw = document.getElementById('newMaster').value;
            const confirmVal = document.getElementById('confirmNewMaster').value;
            if (!current || !nw || nw !== confirmVal) return alert('Passwords do not match or are empty.');

            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(current));
            const hexCurrent = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

            chrome.storage.local.get(['masterHash', 'salt', 'accounts'], async data => {
                if (data.masterHash !== hexCurrent) return alert('Incorrect current Master Password.');

                const saltOldBuf = base64ToArrayBuffer(data.salt);
                const oldKey = await deriveKey(current, new Uint8Array(saltOldBuf));

                const accounts = data.accounts || [];
                const decrypted = [];
                for (const acct of accounts) {
                    const ivBuf = new Uint8Array(base64ToArrayBuffer(acct.iv));
                    const cipherBuf = base64ToArrayBuffer(acct.password);
                    try {
                        const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuf }, oldKey, cipherBuf);
                        decrypted.push({ ...acct, plain: new TextDecoder().decode(plainBuf) });
                    } catch { /* skip */ }
                }

                const saltArr = crypto.getRandomValues(new Uint8Array(16));
                const saltStr = arrayBufferToBase64(saltArr);
                const newKey = await deriveKey(nw, saltArr);

                const reEncrypted = [];
                for (const acct of decrypted) {
                    const iv = crypto.getRandomValues(new Uint8Array(12));
                    const encBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, newKey, new TextEncoder().encode(acct.plain));
                    reEncrypted.push({ site: acct.site, username: acct.username, password: arrayBufferToBase64(encBuf), iv: arrayBufferToBase64(iv), favorite: acct.favorite });
                }

                const newHashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nw));
                const newHash = Array.from(new Uint8Array(newHashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

                chrome.storage.local.set({ accounts: reEncrypted, masterHash: newHash, salt: saltStr }, () => {
                    alert('Master Password successfully changed!');
                    cryptoKey = newKey;
                    editForm.classList.add('hidden');
                });
            });
        });

        addBtn.addEventListener('click', () => openForm());
        cancelFormBtn.addEventListener('click', () => { addForm.classList.add('hidden'); editIdx = null; });
        saveFormBtn.addEventListener('click', async () => await saveAccount());
        deleteFormBtn.addEventListener('click', () => { if (editIdx !== null && confirm('Delete this entry?')) removeAccount(editIdx); });

        async function openForm(account = null, idx = null) {
            document.getElementById('site').value = account ? account.site : '';
            document.getElementById('username').value = account ? account.username : '';
            if (account) {
                try { document.getElementById('password').value = await decryptText(account.password, account.iv); } catch { document.getElementById('password').value = ''; }
                deleteFormBtn.classList.remove('hidden');
            } else deleteFormBtn.classList.add('hidden');
            editIdx = idx;
            addForm.classList.remove('hidden');
        }

        async function saveAccount() {
            const site = document.getElementById('site').value.trim();
            const user = document.getElementById('username').value.trim();
            const pwd = document.getElementById('password').value.trim();
            if (!site || !user || !pwd) return alert('Please fill in all fields!');

            const { iv, cipher } = await encryptText(pwd);
            chrome.storage.local.get('accounts', data => {
                const arr = data.accounts || [];
                if (editIdx !== null) {
                    const prev = arr[editIdx] || {};
                    arr[editIdx] = { site, username: user, password: cipher, iv, favorite: prev.favorite || false };
                } else arr.push({ site, username: user, password: cipher, iv, favorite: false });
                chrome.storage.local.set({ accounts: arr }, () => { loadAccounts(); addForm.classList.add('hidden'); editIdx = null; });
            });
        }

        function loadAccounts() {
            chrome.storage.local.get('accounts', async data => {
                accountsList.innerHTML = '';
                let accounts = data.accounts || [];
                if (filterType === 'FAVORITES') accounts = accounts.filter(a => a.favorite);
                if (searchQuery) accounts = accounts.filter(a => a.site.toLowerCase().includes(searchQuery) || a.username.toLowerCase().includes(searchQuery));
                for (let i = 0; i < accounts.length; i++) {
                    const acct = accounts[i];
                    let length = 8;
                    try { length = (await decryptText(acct.password, acct.iv)).length; } catch { }
                    const masked = '*'.repeat(length);
                    const favSrc = acct.favorite ? 'images/favorite-yellow-icon.png' : 'images/favorite-white-icon.png';
                    const div = document.createElement('div');
                    div.className = 'password-item';
                    div.innerHTML = `
                    <strong>${acct.site}</strong>
                    <span>${acct.username}</span>
                    <span class="password-text">${masked}</span>
                    <div class="password-actions">
                        <button class="show-password" data-i="${i}"><img src="images/show-icon.png" alt="Show/Hide"></button>
                        <button class="copy-password" data-i="${i}"><img src="images/copy-icon.png" alt="Copy"></button>
                        <button class="edit" data-i="${i}"><img src="images/edit-icon.png" alt="Edit"></button>
                        <button class="autofill" data-i="${i}"><img src="images/autocomplete-icon.png" alt="Autofill"></button>
                        <button class="delete" data-i="${i}"><img src="images/delete-icon.png" alt="Delete"></button>
                        <button class="favorite" data-i="${i}"><img src="${favSrc}" alt="Favorite"></button>
                    </div>`;
                    accountsList.appendChild(div);
                }
                bindAccountActions();
            });
        }

        function bindAccountActions() {
            document.querySelectorAll('.show-password').forEach(btn => {
                btn.addEventListener('click', async e => {
                    const idx = +e.currentTarget.dataset.i;
                    const pwdSpan = e.currentTarget.closest('.password-item').querySelector('.password-text');
                    const iconImg = e.currentTarget.querySelector('img');
                    chrome.storage.local.get('accounts', async data => {
                        const acct = data.accounts[idx];
                        let actual = '';
                        try { actual = await decryptText(acct.password, acct.iv); } catch { }
                        if (pwdSpan.textContent.includes('*')) {
                            pwdSpan.textContent = actual;
                            iconImg.src = 'images/hide-icon.png';
                        } else {
                            pwdSpan.textContent = '*'.repeat(actual.length);
                            iconImg.src = 'images/show-icon.png';
                        }
                    });
                });
            });
            document.querySelectorAll('.copy-password').forEach(btn => {
                btn.addEventListener('click', e => {
                    const idx = +e.currentTarget.dataset.i;
                    chrome.storage.local.get('accounts', async data => {
                        const acct = data.accounts[idx];
                        let actual = '';
                        try { actual = await decryptText(acct.password, acct.iv); } catch { }
                        navigator.clipboard.writeText(actual);
                        alert('Password copied!');
                    });
                });
            });
            document.querySelectorAll('.autofill').forEach(btn => {
                btn.addEventListener('click', e => {
                    const idx = +e.currentTarget.dataset.i;
                    chrome.storage.local.get('accounts', async data => {
                        const acct = data.accounts[idx];
                        let actual = '';
                        try { actual = await decryptText(acct.password, acct.iv); } catch { }
                        navigator.clipboard.writeText(actual);
                        alert('Password copied for autofill!');
                    });
                });
            });
            document.querySelectorAll('.delete').forEach(btn => {
                btn.addEventListener('click', e => {
                    const idx = +e.currentTarget.dataset.i;
                    if (confirm('Delete this entry?')) removeAccount(idx);
                });
            });
            document.querySelectorAll('.favorite').forEach(btn => {
                btn.addEventListener('click', e => {
                    const idx = +e.currentTarget.dataset.i;
                    const iconImg = e.currentTarget.querySelector('img');
                    chrome.storage.local.get('accounts', data => {
                        const accounts = data.accounts || [];
                        accounts[idx].favorite = !accounts[idx].favorite;
                        chrome.storage.local.set({ accounts }, () => {
                            iconImg.src = accounts[idx].favorite ? 'images/favorite-yellow-icon.png' : 'images/favorite-white-icon.png';
                        });
                    });
                });
            });
            document.querySelectorAll('.edit').forEach(btn => {
                btn.addEventListener('click', e => {
                    const i = +e.currentTarget.dataset.i;
                    chrome.storage.local.get('accounts', d => openForm(d.accounts[i], i));
                });
            });
        }

        function removeAccount(idx) {
            chrome.storage.local.get('accounts', data => {
                const arr = data.accounts || [];
                arr.splice(idx, 1);
                chrome.storage.local.set({ accounts: arr }, () => {
                    loadAccounts();
                    addForm.classList.add('hidden');
                    editIdx = null;
                });
            });
        }
    }
});
