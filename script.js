document.addEventListener('DOMContentLoaded', () => {
    // If you are hosting the frontend separately from the backend, put your Render URL here.
    // Example: const API_BASE_URL = 'https://nist-faculty-appointments-xyz.onrender.com';
    // If frontend and backend are hosted together, leave it as an empty string.
    const API_BASE_URL = ''; 
    const API_LOGIN_FACULTY = API_BASE_URL + '/api/login/faculty';
    const API_LOGIN_STUDENT = API_BASE_URL + '/api/login/student';
    const API_FREETIMES = API_BASE_URL + '/api/freetimes';
    
    // Login Elements
    const loginScreen = document.getElementById('login-screen');
    const mainDashboard = document.getElementById('main-dashboard');
    const tabStudent = document.getElementById('tab-student');
    const tabFaculty = document.getElementById('tab-faculty');
    const formLoginStudent = document.getElementById('student-login-form');
    const formLoginFaculty = document.getElementById('faculty-login-form');
    let facultyNameInput = document.getElementById('facultyName'); // on the post form
    
    // Switch tabs on Login screen
    tabStudent.addEventListener('click', () => {
        tabStudent.classList.add('active');
        tabFaculty.classList.remove('active');
        formLoginStudent.classList.add('active');
        formLoginFaculty.classList.remove('active');
    });
    tabFaculty.addEventListener('click', () => {
        tabFaculty.classList.add('active');
        tabStudent.classList.remove('active');
        formLoginFaculty.classList.add('active');
        formLoginStudent.classList.remove('active');
    });

    // Handle Student Login
    formLoginStudent.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgBox = document.getElementById('student-login-msg');
        await attemptLogin(API_LOGIN_STUDENT, new FormData(formLoginStudent), msgBox);
    });

    // Handle Faculty Login
    formLoginFaculty.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgBox = document.getElementById('faculty-login-msg');
        await attemptLogin(API_LOGIN_FACULTY, new FormData(formLoginFaculty), msgBox);
    });

    const attemptLogin = async (url, formData, msgBox) => {
        const data = Object.fromEntries(formData.entries());
        msgBox.textContent = 'Authenticating...';
        msgBox.className = 'form-msg';
        msgBox.style.opacity = '1';

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const resData = await response.json();
            if (!response.ok || !resData.success) throw new Error(resData.message || 'Login failed');

            // Success Transition
            loginScreen.classList.add('hidden');
            mainDashboard.classList.remove('hidden');

            if (resData.role === 'student') {
                document.body.classList.add('student-view'); // hide form
            } else if (resData.role === 'faculty') {
                document.body.classList.remove('student-view'); // reveal form
                facultyNameInput.value = resData.name; // Pre-fill name organically
            }

            // Init dashboard
            fetchFreeTimes();
            
        } catch (error) {
            msgBox.textContent = error.message;
            msgBox.className = 'form-msg error';
        }
    };

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        mainDashboard.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        formLoginFaculty.reset();
        formLoginStudent.reset();
        document.getElementById('faculty-login-msg').style.opacity = '0';
        document.getElementById('student-login-msg').style.opacity = '0';
    });


    /* ====================================
       Dashboard Logic 
       ==================================== */
    const form = document.getElementById('freetime-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner');
    const formMsg = document.getElementById('form-msg');
    
    const freeTimesList = document.getElementById('freetimes-list');
    const refreshBtn = document.getElementById('refresh-btn');
    const searchInput = document.getElementById('search-input');

    let currentData = [];

    const getMonthShort = (dateStr) => new Date(dateStr).toLocaleString('en-US', { month: 'short' });
    const getDay = (dateStr) => {
        const date = new Date(dateStr);
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        return date.getDate().toString().padStart(2, '0');
    };

    const fetchFreeTimes = async () => {
        try {
            if(freeTimesList.children.length === 0) {
                 freeTimesList.innerHTML = `<div class="skeleton-card"></div><div class="skeleton-card"></div>`;
            }

            const response = await fetch(API_FREETIMES);
            if (!response.ok) throw new Error('Failed to fetch free times');
            
            const data = await response.json();
            data.sort((a, b) => new Date(`${a.date}T${a.startTime}`) - new Date(`${b.date}T${b.startTime}`));
            
            currentData = data;
            const term = searchInput.value.toLowerCase();
            const filtered = currentData.filter(slot => slot.facultyName.toLowerCase().includes(term));
            
            renderFreeTimes(filtered);
        } catch (error) {
            freeTimesList.innerHTML = `<div class="empty-state"><p>Failed to load faculty schedules.</p></div>`;
        }
    };

    const renderFreeTimes = (times) => {
        freeTimesList.innerHTML = '';
        if (times.length === 0) {
            freeTimesList.innerHTML = `<div class="empty-state"><p>No available faculty free times posted.</p></div>`;
            return;
        }

        times.forEach((slot, index) => {
            const delay = index * 0.1; 
            const card = document.createElement('div');
            card.className = 'appt-card';
            card.style.animationDelay = `${delay}s`;
            card.innerHTML = `
                <div class="appt-date-box">
                    <div class="appt-day">${getDay(slot.date)}</div>
                    <div class="appt-month">${getMonthShort(slot.date)}</div>
                </div>
                <div class="appt-details">
                    <div class="appt-name">${slot.facultyName}</div>
                    <div class="appt-meta">
                        <span>${slot.startTime} - ${slot.endTime}</span>
                        <span class="appt-tag" style="background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); color: #fff;">${slot.region}</span>
                        <span class="appt-tag" style="background: rgba(236,72,153,0.15); border-color: rgba(236,72,153,0.3); color: #fff;">Room: ${slot.roomNumber}</span>
                    </div>
                </div>
            `;
            freeTimesList.appendChild(card);
        });
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        submitBtn.disabled = true;
        formMsg.textContent = '';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(API_FREETIMES, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Failed to post free time');
            formMsg.textContent = 'Free time posted successfully!';
            formMsg.className = 'form-msg success';
            // Only clear date, time, room, keep Faculty Name and Region
            document.getElementById('date').value = '';
            document.getElementById('startTime').value = '';
            document.getElementById('endTime').value = '';
            document.getElementById('roomNumber').value = '';
            
            fetchFreeTimes();
        } catch (error) {
            formMsg.textContent = 'Error posting schedule. Try again.';
            formMsg.className = 'form-msg error';
        } finally {
            setTimeout(() => {
                btnText.style.display = 'block';
                spinner.style.display = 'none';
                submitBtn.disabled = false;
                if(formMsg.classList.contains('success')) {
                    setTimeout(() => { formMsg.style.opacity = '0'; }, 3000);
                }
            }, 600);
        }
    });

    refreshBtn.addEventListener('click', () => {
        refreshBtn.style.transform = 'rotate(180deg)';
        fetchFreeTimes().then(() => { setTimeout(() => { refreshBtn.style.transform = 'rotate(0deg)'; }, 300); });
    });

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = currentData.filter(slot => slot.facultyName.toLowerCase().includes(term));
        renderFreeTimes(filtered);
    });
    // AI Chat Assistant Logic
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if(chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userInput = chatInput.value.trim();
            if(!userInput) return;

            // Display user message
            const userMsgDiv = document.createElement('div');
            userMsgDiv.className = 'message user-message';
            userMsgDiv.textContent = userInput;
            chatMessages.appendChild(userMsgDiv);
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Simulate AI delay
            setTimeout(() => {
                let aiReply = "I couldn't find any information regarding that query.";
                const q = userInput.toLowerCase();
                
                let foundSlots = [];
                let isNameQuery = false;
                let isRegionQuery = false;
                
                // Match Faculty Name
                currentData.forEach(slot => {
                    const fname = slot.facultyName.toLowerCase();
                    if(q.includes(fname) || (fname.includes(' ') && q.includes(fname.split(' ').pop()))) {
                        foundSlots.push(slot);
                        isNameQuery = true;
                    }
                });

                // Match Region if no name match
                if(foundSlots.length === 0) {
                    const regions = ['lhc', 'atrium', 'tifac', 'galleria'];
                    for(const r of regions) {
                        if(q.includes(r)) {
                            foundSlots = currentData.filter(s => s.region.toLowerCase() === r);
                            isRegionQuery = true;
                            break;
                        }
                    }
                }

                if(foundSlots.length > 0) {
                    if(isNameQuery) {
                        const s = foundSlots[0];
                        aiReply = `${s.facultyName} is available at ${s.region} (Room ${s.roomNumber}) from ${s.startTime} to ${s.endTime} on ${s.date}.`;
                    } else if(isRegionQuery) {
                        if(foundSlots.length === 1) {
                            aiReply = `I found 1 faculty member at ${foundSlots[0].region}: ${foundSlots[0].facultyName} in Room ${foundSlots[0].roomNumber}.`;
                        } else {
                            const names = foundSlots.map(s => s.facultyName).join(", ");
                            aiReply = `There are ${foundSlots.length} faculty members at ${foundSlots[0].region}: ${names}.`;
                        }
                    }
                } else {
                    if (q.includes('hello') || q.includes('hi')) aiReply = "Hello! Tell me a faculty name or a region, and I'll find their availability.";
                }

                // Display AI reply
                const aiMsgDiv = document.createElement('div');
                aiMsgDiv.className = 'message ai-message';
                aiMsgDiv.textContent = aiReply;
                chatMessages.appendChild(aiMsgDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;

            }, 700);
        });
    }
});
