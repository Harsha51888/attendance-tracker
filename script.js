document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const addSubjectForm = document.getElementById('add-subject-form');
    const subjectsList = document.getElementById('subjects-list');
    const emptyState = document.getElementById('empty-state');

    // --- Configuration ---
    // The minimum attendance percentage required to be in the "Safe Zone"
    const ATTENDANCE_THRESHOLD = 75;

    // --- DATA MANAGEMENT ---
    /**
     * Retrieves subjects from localStorage.
     * @returns {Array} An array of subject objects, or an empty array if none are found.
     */
    const getSubjects = () => {
        const subjects = localStorage.getItem('attendanceTrackerSubjects');
        return subjects ? JSON.parse(subjects) : [];
    };

    /**
     * Saves the current list of subjects to localStorage.
     * @param {Array} subjects - The array of subject objects to save.
     */
    const saveSubjects = (subjects) => {
        localStorage.setItem('attendanceTrackerSubjects', JSON.stringify(subjects));
    };

    // --- UI RENDERING ---
    /**
     * Renders all subjects to the DOM, creating a card for each one.
     */
    const renderSubjects = () => {
        const subjects = getSubjects();
        subjectsList.innerHTML = ''; // Clear the list before re-rendering

        if (subjects.length === 0) {
            emptyState.classList.remove('hidden'); // Show the 'empty' message
        } else {
            emptyState.classList.add('hidden'); // Hide the 'empty' message
            subjects.forEach((subject, index) => {
                const subjectCard = createSubjectCard(subject, index);
                subjectsList.appendChild(subjectCard);
            });
        }
    };

    /**
     * Creates an HTML element for a single subject card.
     * @param {object} subject - The subject data (name, credits, etc.).
     * @param {number} index - The index of the subject in the array.
     * @returns {HTMLElement} The created card element with all its inner HTML and event listeners.
     */
    const createSubjectCard = (subject, index) => {
        const card = document.createElement('div');
        card.classList.add('bg-white', 'p-5', 'rounded-2xl', 'shadow-lg', 'subject-card-enter');
        card.dataset.index = index;

        const percentage = subject.totalClasses > 0 
            ? ((subject.attendedClasses / subject.totalClasses) * 100).toFixed(1) 
            : 0;

        const isSafe = percentage >= ATTENDANCE_THRESHOLD;
        const statusColor = isSafe ? 'text-green-600' : 'text-red-600';
        const statusBgColor = isSafe ? 'bg-green-100' : 'bg-red-100';
        const statusText = isSafe ? 'Safe Zone' : 'Danger Zone';

        // Calculate how many classes are needed to reach the threshold or how many can be missed
        const classesToAttend = subject.totalClasses > 0 && !isSafe
            ? Math.ceil((ATTENDANCE_THRESHOLD / 100 * subject.totalClasses - subject.attendedClasses) / (1 - ATTENDANCE_THRESHOLD / 100))
            : 0;
        
        const bunkableClasses = isSafe
            ? Math.floor((subject.attendedClasses - (ATTENDANCE_THRESHOLD / 100 * subject.totalClasses)) / (ATTENDANCE_THRESHOLD / 100))
            : 0;

        let message = '';
        if (!isSafe) {
            message = `You need to attend the next <strong class="font-bold">${classesToAttend}</strong> classes to reach ${ATTENDANCE_THRESHOLD}%.`;
        } else {
            message = `You can afford to miss <strong class="font-bold">${bunkableClasses}</strong> classes.`;
        }

        // The inner HTML of the card, structured with Tailwind CSS classes
        card.innerHTML = `
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h3 class="text-xl font-bold text-slate-800">${subject.name}</h3>
                    <p class="text-sm text-slate-500">Credits: ${subject.credits}</p>
                </div>
                <div class="mt-2 sm:mt-0 flex items-center gap-2 px-3 py-1 rounded-full ${statusBgColor} ${statusColor}">
                    <span class="font-semibold text-sm">${statusText}</span>
                </div>
            </div>

            <div class="mt-4">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium">Attendance</span>
                    <span class="text-sm font-bold ${statusColor}">${percentage}%</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-2.5">
                    <div class="h-2.5 rounded-full ${isSafe ? 'bg-green-500' : 'bg-red-500'}" style="width: ${percentage}%"></div>
                </div>
                <p class="text-xs text-slate-500 text-right mt-1">
                    Attended: ${subject.attendedClasses} / Total: ${subject.totalClasses}
                </p>
            </div>

            <div class="mt-3 text-sm text-center text-slate-600 p-2 bg-slate-50 rounded-lg">
               ${message}
            </div>

            <div class="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-2 justify-end">
                <button class="btn-attended flex-grow sm:flex-grow-0 bg-green-500 text-white px-3 py-1.5 text-sm font-semibold rounded-md hover:bg-green-600 transition-colors">Attended Class</button>
                <button class="btn-missed flex-grow sm:flex-grow-0 bg-yellow-500 text-white px-3 py-1.5 text-sm font-semibold rounded-md hover:bg-yellow-600 transition-colors">Missed Class</button>
                <button class="btn-delete flex-grow sm:flex-grow-0 bg-red-500 text-white px-3 py-1.5 text-sm font-semibold rounded-md hover:bg-red-600 transition-colors">Delete</button>
            </div>
        `;

        // Add event listeners for the buttons on this specific card
        card.querySelector('.btn-attended').addEventListener('click', () => handleAttendanceUpdate(index, true));
        card.querySelector('.btn-missed').addEventListener('click', () => handleAttendanceUpdate(index, false));
        card.querySelector('.btn-delete').addEventListener('click', () => handleDeleteSubject(index));

        return card;
    };

    // --- EVENT HANDLERS ---
    /**
     * Handles the form submission to add a new subject.
     * @param {Event} e - The form submission event.
     */
    const handleAddSubject = (e) => {
        e.preventDefault();
        const name = document.getElementById('subject-name').value.trim();
        const credits = parseInt(document.getElementById('subject-credits').value);
        const attendedClasses = parseInt(document.getElementById('attended-classes').value);
        const totalClasses = parseInt(document.getElementById('total-classes').value);

        if (!name || isNaN(credits) || isNaN(attendedClasses) || isNaN(totalClasses)) {
            console.error("Invalid input: Please fill out all fields correctly.");
            return;
        }
        
        if (attendedClasses > totalClasses) {
            alert("Attended classes cannot be more than total classes.");
            return;
        }

        const newSubject = { name, credits, attendedClasses, totalClasses };
        const subjects = getSubjects();
        subjects.push(newSubject);
        saveSubjects(subjects);
        renderSubjects();
        addSubjectForm.reset();
        document.getElementById('attended-classes').value = 0;
        document.getElementById('total-classes').value = 0;
    };

    /**
     * Handles updating attendance (either attended or missed).
     * @param {number} index - The index of the subject to update.
     * @param {boolean} attended - True if the class was attended, false if missed.
     */
    const handleAttendanceUpdate = (index, attended) => {
        const subjects = getSubjects();
        if (subjects[index]) {
            subjects[index].totalClasses++;
            if (attended) {
                subjects[index].attendedClasses++;
            }
            saveSubjects(subjects);
            renderSubjects();
        }
    };

    /**
     * Handles deleting a subject from the list.
     * @param {number} index - The index of the subject to delete.
     */
    const handleDeleteSubject = (index) => {
        if (confirm('Are you sure you want to delete this subject?')) {
            const subjects = getSubjects();
            subjects.splice(index, 1);
            saveSubjects(subjects);
            renderSubjects();
        }
    };

    // --- INITIALIZATION ---
    // Attach the main form submission event listener
    addSubjectForm.addEventListener('submit', handleAddSubject);
    // Initial render of subjects from localStorage when the page loads
    renderSubjects();
});
