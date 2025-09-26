const form = document.getElementById("introForm");
const output = document.getElementById("output");

// sample courses used for initial state and reset
const SAMPLE_COURSES = [
  { dept: 'ITIS', number: '3135', name: 'Web Application Development I', reason: "I need this to graduate." },
  { dept: 'WEB', number: '115', name: 'Advanced Markup and Scripting', reason: "I'm majoring in full stack development." },
  { dept: 'ITSC', number: '1110', name: 'Computer Science Principles', reason: "I'm a CS 3rd year and need an easy A." },
  { dept: 'SCUBA', number: '1111', name: 'Underwater Basket Weaving', reason: "Doesn't everyone take this?" }
];

// sample full form data (alpaca-themed) used by Load Sample
const SAMPLE_FORM_DATA = {
  firstName: 'Joella',
  middleName: 'Fleur',
  lastName: 'Hoofer',
  preferredName: 'Jo',
  mascotDescriptor: 'Janky',
  mascot: 'Hippo',
  displayName: 'Joella "Jo" Hoofer',
  email: 'joella.hoofer@example.edu',
  acknowledgment: 'JH - 09/26/2025',
  imageUrl: 'https://picsum.photos/300?random=1',
  caption: 'Someplace I\'d rather be',
  personalStatement: "I'm a developer and educator who loves teaching people how to reason with code and algorithms. I enjoy hands-on projects, open-source collaboration, and coffee while debugging.",
  quoteText: 'Simplicity is the soul of efficiency.',
  quoteAuthor: 'Ada Lovelace',
  personalBackground: 'Grew up near the Andes; enjoys trekking, photography, and local cuisine.',
  professionalBackground: '5 years as a software engineer, 3 years as a curriculum developer for introductory CS courses.',
  academicBackground: 'BSc in Computer Science; ongoing study in human-centered computing.',
  funnyRemember: 'Once taught a class of llamas to debug a loop',
  otherNotes: "Prefers quinoa snacks and composes multilingual commit messages (12 languages)",
  computerPlatform: 'Laptop',
  computerOS: 'macOS',
  workLocation: 'Home office (City)',
  backupPlan: 'Use campus lab machine; phone hotspot and basic editor; keep code in cloud repo.'
};

// Rendering now uses DOM APIs (createElement/textContent) so explicit HTML-escaping helper is not needed.

// Load saved data from localStorage
window.addEventListener("load", () => {
  const savedData = localStorage.getItem("introData");
  // cache add button; the courses table will be queried where needed to avoid TDZ issues
  const addCourseBtn = document.getElementById('addCourseBtn');
  if (savedData) {
    const data = JSON.parse(savedData);
    for (const [key, value] of Object.entries(data)) {
      const field = form.elements[key];
      if (field) field.value = value;
    }
    // If saved data has a legacy combined `mascot` value, try to split into descriptor + mascot
    if (data.mascot && form.elements['mascotDescriptor'] && form.elements['mascot']) {
      // only split if descriptor field is empty (avoid overwriting explicit values)
      const descField = form.elements['mascotDescriptor'];
      const mascField = form.elements['mascot'];
      if ((!descField.value || descField.value.trim() === '') && mascField.value && mascField.value.trim().indexOf(' ') !== -1) {
        const parts = mascField.value.trim().split(/\s+/);
        const last = parts.pop();
        descField.value = parts.join(' ');
        mascField.value = last;
      }
    }
    // populate courses into the table first, then render preview
    if (data.courses && Array.isArray(data.courses)) {
      populateCoursesFromData(data.courses);
    }
    // recompute and set readonly displayName to include middle initial and update the data object
    try {
      const fd = new FormData(form);
      const dn = computeDisplayName(fd);
      if (form.elements['displayName']) form.elements['displayName'].value = dn;
      data.displayName = dn;
    } catch (e) {}
    renderIntro(data);
  } else {
    // no saved data: auto-save current (prefilled) form values
    const initialData = Object.fromEntries(new FormData(form).entries());
    // provide sample courses for initial state
    initialData.courses = SAMPLE_COURSES.slice();
  // persist and render the initial sample data
  // ensure readonly displayName matches the computed format
  try { const fd0 = new FormData(form); initialData.displayName = computeDisplayName(fd0); if (form.elements['displayName']) form.elements['displayName'].value = initialData.displayName; } catch(e) {}
  localStorage.setItem('introData', JSON.stringify(initialData));
    // ensure fields reflect initialData
    for (const [key, value] of Object.entries(initialData)) {
      const field = form.elements[key];
      if (field) field.value = value;
    }
    // populate initial sample courses then render
    if (initialData.courses && Array.isArray(initialData.courses)) populateCoursesFromData(initialData.courses);
    renderIntro(initialData);
  }

  // wire reset (clear) and load sample buttons
  const resetBtn = document.getElementById('resetBtn');
  const loadSampleBtn = document.getElementById('loadSampleBtn');
  // top duplicated buttons (subtle/texty)
  const submitTopBtn = document.getElementById('submitTopBtn');
  const loadSampleTopBtn = document.getElementById('loadSampleTopBtn');
  const resetTopBtn = document.getElementById('resetTopBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // If the current form matches the shipped SAMPLE data (form + courses), treat this as "clear sample" and skip the warning.
      const isSample = (function() {
        try {
          const keys = ['firstName','middleName','lastName','preferredName','mascotDescriptor','mascot','caption'];
          for (const k of keys) {
            const el = form.elements[k];
            const v = el ? (el.value || '').trim() : '';
            const sv = (SAMPLE_FORM_DATA[k] || '').toString().trim();
            if (v !== sv) return false;
          }
          // compare courses
          const table = document.getElementById('coursesTable');
          const rows = table ? Array.from(table.querySelectorAll('.course-row')) : [];
          if (rows.length !== SAMPLE_COURSES.length) return false;
          for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const s = SAMPLE_COURSES[i] || {};
            const dept = (r.querySelector('input[name="course_dept"]') || {}).value || '';
            const number = (r.querySelector('input[name="course_number"]') || {}).value || '';
            const name = (r.querySelector('input[name="course_name"]') || {}).value || '';
            const reason = (r.querySelector('input[name="course_reason"]') || {}).value || '';
            if (dept.trim() !== (s.dept || '').toString().trim() || number.trim() !== (s.number || '').toString().trim() || name.trim() !== (s.name || '').toString().trim() || reason.trim() !== (s.reason || '').toString().trim()) return false;
          }
          return true;
        } catch (e) { return false; }
      })();

      if (!isSample) {
        // warn user before clearing persisted data
        const ok = window.confirm('Warning: this will clear the form and permanently delete the saved data stored in your browser. Continue?');
        if (!ok) return;
      }
      // remove persisted data
      localStorage.removeItem('introData');
      // clear preview
      if (output) output.innerHTML = '';
      // clear all form controls so fields become empty (form.reset() would revert to HTML defaults)
      Array.from(form.querySelectorAll('input,textarea,select')).forEach(el => {
        const tag = el.tagName.toLowerCase();
        const type = (el.type || '').toLowerCase();
        if (type === 'checkbox' || type === 'radio') {
          el.checked = false;
        } else if (tag === 'select') {
          try { el.selectedIndex = -1; } catch (e) { /* ignore */ }
        } else {
          el.value = '';
        }
      });
      // clear any generated displayName explicitly
      if (form.elements['displayName']) form.elements['displayName'].value = '';
      // clear courses table rows
      const table = document.getElementById('coursesTable');
      if (table) Array.from(table.querySelectorAll('.course-row')).forEach(r => r.remove());
      reindexCourseRows();
      // focus first field for convenience
      const first = form.querySelector('input[name="firstName"]'); if (first) first.focus();
    });
  }
  if (loadSampleBtn) {
    loadSampleBtn.addEventListener('click', () => {
      // populate form fields from SAMPLE_FORM_DATA
      for (const [k, v] of Object.entries(SAMPLE_FORM_DATA)) {
        const f = form.elements[k]; if (f) f.value = v;
      }
      // populate courses
      const table = document.getElementById('coursesTable');
      if (table) {
        Array.from(table.querySelectorAll('.course-row')).forEach(r => r.remove());
        SAMPLE_COURSES.forEach(c => addCourseRow(c));
      }
      // persist combined data
      const data = Object.fromEntries(new FormData(form).entries());
      data.courses = SAMPLE_COURSES.slice();
      // combine mascot descriptor + mascot
      const desc = (form.elements['mascotDescriptor'] || {}).value || '';
      const masc = (form.elements['mascot'] || {}).value || '';
      const combined = [desc.trim(), masc.trim()].filter(Boolean).join(' ').trim();
      if (combined) data.mascot = combined;
      // recompute and set displayName with middle initial
      try { const fd1 = new FormData(form); data.displayName = computeDisplayName(fd1); if (form.elements['displayName']) form.elements['displayName'].value = data.displayName; } catch(e) {}
      localStorage.setItem('introData', JSON.stringify(data));
      renderIntro(data);
    });
  }

  // wire top buttons to existing handlers (delegation)
  if (submitTopBtn) submitTopBtn.addEventListener('click', () => {
    // trigger form submit
    form.requestSubmit ? form.requestSubmit() : form.submit();
  });
  if (loadSampleTopBtn && loadSampleBtn) loadSampleTopBtn.addEventListener('click', () => loadSampleBtn.click());
  if (resetTopBtn && resetBtn) resetTopBtn.addEventListener('click', () => resetBtn.click());

  // Courses: helper to add/remove rows
  function addCourseRow(course = {}, index = null) {
    const row = document.createElement('div');
    row.className = 'course-row';
    const idx = document.createElement('div'); idx.className = 'col-num'; idx.textContent = '';
    const dept = document.createElement('input'); dept.name = 'course_dept'; dept.placeholder = 'e.g., CS'; dept.value = course.dept || '';
    const number = document.createElement('input'); number.name = 'course_number'; number.placeholder = 'e.g., 101'; number.value = course.number || '';
    const name = document.createElement('input'); name.name = 'course_name'; name.placeholder = 'Course title'; name.value = course.name || '';
    const reason = document.createElement('input'); reason.name = 'course_reason'; reason.placeholder = 'Reason for taking'; reason.value = course.reason || '';
  const actions = document.createElement('div'); actions.className = 'col-actions';
  // Move Up / Move Down buttons for keyboard accessibility
  const moveUpBtn = document.createElement('button'); moveUpBtn.type = 'button'; moveUpBtn.className = 'move-up'; moveUpBtn.title = 'Move row up'; moveUpBtn.textContent = '↑';
  moveUpBtn.addEventListener('click', () => {
    const prev = row.previousElementSibling;
    const table = document.getElementById('coursesTable');
    if (prev && prev.classList.contains('course-row')) {
      table.insertBefore(row, prev);
      reindexCourseRows();
      // keep focus on the first input
      const f = row.querySelector('input[name="course_dept"]') || row.querySelector('input'); if (f) f.focus();
    }
  });
  const moveDownBtn = document.createElement('button'); moveDownBtn.type = 'button'; moveDownBtn.className = 'move-down'; moveDownBtn.title = 'Move row down'; moveDownBtn.textContent = '↓';
  moveDownBtn.addEventListener('click', () => {
    const next = row.nextElementSibling;
    const table = document.getElementById('coursesTable');
    if (next && next.classList.contains('course-row')) {
      table.insertBefore(next, row);
      reindexCourseRows();
      const f = row.querySelector('input[name="course_dept"]') || row.querySelector('input'); if (f) f.focus();
    }
  });
  const removeBtn = document.createElement('button'); removeBtn.type = 'button'; removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => { row.remove(); reindexCourseRows(); });
  actions.appendChild(moveUpBtn);
  actions.appendChild(moveDownBtn);
  actions.appendChild(removeBtn);
  // per-row inline error message
  const rowError = document.createElement('div'); rowError.className = 'row-error'; rowError.setAttribute('aria-live', 'polite'); rowError.style.display = 'none';
  actions.appendChild(rowError);
    row.appendChild(idx);
    const wrapDept = document.createElement('div'); wrapDept.className = 'col-dept'; wrapDept.appendChild(dept);
    const wrapNumber = document.createElement('div'); wrapNumber.className = 'col-number'; wrapNumber.appendChild(number);
    const wrapName = document.createElement('div'); wrapName.className = 'col-name'; wrapName.appendChild(name);
    const wrapReason = document.createElement('div'); wrapReason.className = 'col-reason'; wrapReason.appendChild(reason);
    row.appendChild(wrapDept);
    row.appendChild(wrapNumber);
    row.appendChild(wrapName);
    row.appendChild(wrapReason);
    row.appendChild(actions);

    // make row draggable
    row.draggable = true;
    row.addEventListener('dragstart', (e) => {
      row.classList.add('draggable');
      draggingRow = row;
      e.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('draggable');
      draggingRow = null;
      // remove any leftover drag-over classes
      const table = document.getElementById('coursesTable');
      Array.from(table.querySelectorAll('.course-row')).forEach(r => r.classList.remove('drag-over'));
    });

    row.addEventListener('dragover', (e) => { e.preventDefault(); row.classList.add('drag-over'); });
    row.addEventListener('dragleave', () => { row.classList.remove('drag-over'); });
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      row.classList.remove('drag-over');
      if (!draggingRow || draggingRow === row) return;
      // insert draggingRow before this row
      const table = document.getElementById('coursesTable');
      table.insertBefore(draggingRow, row);
      reindexCourseRows();
    });

    // Basic touch fallback for reordering on touch devices
    let touchStartY = 0;
    row.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      row.classList.add('draggable');
    }, { passive: true });
    row.addEventListener('touchmove', (e) => {
      const y = e.touches[0].clientY;
      const dy = y - touchStartY;
      // small translate for feedback
      row.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    row.addEventListener('touchend', (e) => {
  row.style.transform = '';
  row.classList.remove('draggable');
      // simple heuristic: if moved upwards enough, move before previous, if downwards enough, move after next
      const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : touchStartY;
      const delta = endY - touchStartY;
      const threshold = 30; // pixels
      if (delta < -threshold) {
        const prev = row.previousElementSibling;
        const table = document.getElementById('coursesTable');
        if (prev && prev.classList.contains('course-row')) {
          table.insertBefore(row, prev);
          reindexCourseRows();
        }
      } else if (delta > threshold) {
        const next = row.nextElementSibling;
        const table = document.getElementById('coursesTable');
        if (next && next.classList.contains('course-row')) {
          table.insertBefore(next, row);
          reindexCourseRows();
        }
      }
    });

    const table = document.getElementById('coursesTable');
    table.appendChild(row);
    reindexCourseRows();
    return row;
  }

  function reindexCourseRows() {
    const table = document.getElementById('coursesTable');
    const rows = Array.from(table.querySelectorAll('.course-row'));
    rows.forEach((r, i) => {
      const num = r.querySelector('.col-num');
      if (num) num.textContent = String(i + 1);
      // disable/enable move buttons appropriately
      const up = r.querySelector('button.move-up');
      const down = r.querySelector('button.move-down');
      if (up) up.disabled = (i === 0);
      if (down) down.disabled = (i === rows.length - 1);
    });
    const count = rows.length;
    const hidden = document.getElementById('coursesCount');
    if (hidden) hidden.value = String(count);
  }

  function populateCoursesFromData(courses) {
    const table = document.getElementById('coursesTable');
    if (!table) return;
    // remove existing rows
    Array.from(table.querySelectorAll('.course-row')).forEach(r => r.remove());
    courses.forEach(c => addCourseRow(c));
  }

  if (addCourseBtn) addCourseBtn.addEventListener('click', () => addCourseRow({}));

  // dragging state for DnD
  let draggingRow = null;

  // Setup copy buttons (JSON / HTML)
  const copyJsonBtn = document.getElementById('copyJsonBtn');
  const copyHtmlBtn = document.getElementById('copyHtmlBtn');
  const jsonStatus = document.getElementById('copyJsonStatus');
  const htmlStatus = document.getElementById('copyHtmlStatus');
  if (copyJsonBtn) copyJsonBtn.addEventListener('click', () => {
    const jsonArea = document.getElementById('jsonOutput');
    if (!jsonArea) return;
    navigator.clipboard.writeText(jsonArea.value).then(() => {
      if (jsonStatus) { jsonStatus.textContent = 'Copied'; setTimeout(() => jsonStatus.textContent = '', 1500); }
    }).catch(() => { if (jsonStatus) jsonStatus.textContent = 'Copy failed'; });
  });
  if (copyHtmlBtn) copyHtmlBtn.addEventListener('click', () => {
    const htmlArea = document.getElementById('htmlOutput');
    if (!htmlArea) return;
    navigator.clipboard.writeText(htmlArea.value).then(() => {
      if (htmlStatus) { htmlStatus.textContent = 'Copied'; setTimeout(() => htmlStatus.textContent = '', 1500); }
    }).catch(() => { if (htmlStatus) htmlStatus.textContent = 'Copy failed'; });
  });

  // validation UI attached near add button
  const coursesValidation = document.getElementById('coursesValidation') || (() => {
    const d = document.createElement('div'); d.id = 'coursesValidation'; d.style.color = 'darkred'; d.style.marginTop = '0.5rem';
    const addBtnContainer = document.getElementById('addCourseBtn')?.parentElement;
    if (addBtnContainer) addBtnContainer.appendChild(d);
    return d;
  })();

  function validateCourses() {
    const table = document.getElementById('coursesTable');
    const rows = table ? table.querySelectorAll('.course-row') : [];
    const problems = [];
    let anyInvalid = false;
    rows.forEach((r, i) => {
      const dept = (r.querySelector('input[name="course_dept"]') || {}).value?.trim() || '';
      const number = (r.querySelector('input[name="course_number"]') || {}).value?.trim() || '';
      const errEl = r.querySelector('.row-error');
      if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
      r.removeAttribute('data-invalid');
      if (!dept || !number) {
        const msg = `Department and Course # required`;
        problems.push(`Row ${i+1}: ${msg}`);
        if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
        r.dataset.invalid = 'true';
        anyInvalid = true;
      }
    });
    if (problems.length) {
      coursesValidation.textContent = problems.join('; ');
    } else {
      coursesValidation.textContent = '';
    }
    return !anyInvalid;
  }

  // helper to compute displayName: First "Preferred" M. Last ~ Mascot
  function computeDisplayName(formData) {
    const first = (formData.get('firstName') || '').toString().trim();
    const middle = (formData.get('middleName') || '').toString().trim();
    const last = (formData.get('lastName') || '').toString().trim();
    const preferred = (formData.get('preferredName') || '').toString().trim();
    const mascot = (formData.get('mascot') || '').toString().trim();
    const middleInitial = middle ? (middle[0] + '.') : '';
    // Desired format: First M. "Nickname" Last
    const nicknamePart = preferred ? `"${preferred}"` : '';
    const parts = [first, middleInitial, nicknamePart, last].filter(Boolean);
    const namePart = parts.join(' ');
    return mascot ? `${namePart} ~ ${mascot}` : namePart;
  }

  // autosave on input (debounced) and update computed displayName
  let saveTimer = null;
  form.addEventListener('input', () => {
    // compute the displayName and set readonly field
    const fd = new FormData(form);
    const computed = computeDisplayName(fd);
    const displayField = form.elements['displayName'];
    if (displayField) displayField.value = computed;

    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      // validate courses (show per-row errors) but still save drafts
      if (typeof validateCourses === 'function') validateCourses();
      const data = Object.fromEntries(new FormData(form).entries());
      // combine mascotDescriptor + mascot into a single `mascot` string for backward-compatibility
      (function combineMascot(d) {
        const desc = (form.elements['mascotDescriptor'] || {}).value || '';
        const masc = (form.elements['mascot'] || {}).value || '';
        const combined = [desc.trim(), masc.trim()].filter(Boolean).join(' ').trim();
        if (combined) d.mascot = combined;
      })(data);
      // collect courses into an array
      const courses = [];
      const coursesTableEl = document.getElementById('coursesTable');
      if (coursesTableEl) {
        const rows = coursesTableEl.querySelectorAll('.course-row');
        rows.forEach(r => {
          const dept = (r.querySelector('input[name="course_dept"]') || {}).value || '';
          const number = (r.querySelector('input[name="course_number"]') || {}).value || '';
          const name = (r.querySelector('input[name="course_name"]') || {}).value || '';
          const reason = (r.querySelector('input[name="course_reason"]') || {}).value || '';
          if (dept || number || name || reason) courses.push({dept, number, name, reason});
        });
      }
      if (courses.length) data.courses = courses;
      // ensure stored data includes computed displayName
      data.displayName = computed;
      localStorage.setItem('introData', JSON.stringify(data));
      renderIntro(data);
    }, 500);
  });
});

form.addEventListener("submit", function(e) {
  e.preventDefault();
  if (typeof validateCourses === 'function' && !validateCourses()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  // combine mascotDescriptor + mascot into `mascot` for saved data
  (function combineMascot(d) {
    const desc = (form.elements['mascotDescriptor'] || {}).value || '';
    const masc = (form.elements['mascot'] || {}).value || '';
    const combined = [desc.trim(), masc.trim()].filter(Boolean).join(' ').trim();
    if (combined) d.mascot = combined;
  })(data);
  // gather courses similarly for submit
  const courses = [];
  const coursesTableEl = document.getElementById('coursesTable');
  if (coursesTableEl) {
    const rows = coursesTableEl.querySelectorAll('.course-row');
    rows.forEach(r => {
      const dept = (r.querySelector('input[name="course_dept"]') || {}).value || '';
      const number = (r.querySelector('input[name="course_number"]') || {}).value || '';
      const name = (r.querySelector('input[name="course_name"]') || {}).value || '';
      const reason = (r.querySelector('input[name="course_reason"]') || {}).value || '';
      if (dept || number || name || reason) courses.push({dept, number, name, reason});
    });
  }
  if (courses.length) data.courses = courses;

  // Save to localStorage
  localStorage.setItem("introData", JSON.stringify(data));

  // Render the intro page
  try {
    // ensure displayName is present in the saved data
    const fd2 = new FormData(form);
    data.displayName = computeDisplayName(fd2);
  } catch (e) {}
  renderIntro(data);
});

function renderIntro(data) {
  data = data || {};
  // helper to create an element with optional class and text
  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // build the preview into a document fragment first
  const frag = document.createDocumentFragment();

  // Header and acknowledgment
  const nameParts = [];
  if (data.firstName) nameParts.push(data.firstName);
  if (data.middleName) nameParts.push(data.middleName);
  if (data.lastName) nameParts.push(data.lastName);
  const fullNameComputed = nameParts.join(' ');
  frag.appendChild(el('h2', null, fullNameComputed || data.fullName || ''));
  const metaP = document.createElement('p');
  metaP.className = 'italic';
  const metaParts = [];
  if (data.email) metaParts.push(data.email);
  metaP.textContent = metaParts.join(' \u2022 ');
  frag.appendChild(metaP);
  frag.appendChild(el('p', 'italic', data.acknowledgment || ''));

  // display name and mascot
  // prefer explicit displayName, otherwise compose First M. "Nickname" Last and append mascot
  const displayLine = (function() {
    if (data.displayName && data.displayName.trim()) return data.displayName.trim();
    const parts = [];
    if (data.firstName) parts.push(data.firstName);
    if (data.middleName) parts.push((data.middleName.trim()[0] || '') + '.');
    if (data.preferredName) parts.push('"' + data.preferredName + '"');
    if (data.lastName) parts.push(data.lastName);
    return parts.filter(Boolean).join(' ');
  })();
  frag.appendChild(el('p', 'centered large', `${displayLine} ${data.mascot ? ' ~ ' + data.mascot : ''}`));

  // image
  if (data.imageUrl) {
    const img = document.createElement('img');
    img.src = data.imageUrl;
    img.alt = 'Profile Picture';
    img.onerror = function() { this.style.display = 'none'; };
    img.className = 'profile-image';
    frag.appendChild(img);
  }
  frag.appendChild(el('p', 'centered italic', data.caption || ''));
  frag.appendChild(el('p', null, data.personalStatement || ''));

  const list = document.createElement('ul');
  const addListItem = (label, value) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = label;
    li.appendChild(strong);
    li.appendChild(document.createTextNode(' ' + (value || '')));
    list.appendChild(li);
  };

  addListItem('Personal Background:', data.personalBackground);
  addListItem('Professional Background:', data.professionalBackground);
  addListItem('Academic Background:', data.academicBackground);
  // legacy 'Primary Computer' removed; structured details rendered below when present

  const platform = data.computerPlatform || '';
  const os = data.computerOS || '';
  const location = data.workLocation || '';
  const backup = data.backupPlan || '';
  if (platform || os || location) {
    const parts = [];
    if (platform) parts.push(platform);
    if (os) parts.push(os);
    if (location) parts.push(`Location: ${location}`);
    addListItem('Primary Computer (details):', parts.join(' — '));
  }

  // Courses: prefer the structured courses array if present
  if (data.courses && Array.isArray(data.courses) && data.courses.length) {
    const coursesLi = document.createElement('li');
    const coursesStrong = document.createElement('strong');
    coursesStrong.textContent = "Courses I\u2019m Taking & Why:";
    coursesLi.appendChild(coursesStrong);
    const coursesUl = document.createElement('ul');
    data.courses.forEach(c => {
      const cli = document.createElement('li');
      const title = `${c.dept || ''} ${c.number || ''} — ${c.name || ''}`.trim();
      cli.textContent = `${title}: ${c.reason || ''}`;
      coursesUl.appendChild(cli);
    });
    coursesLi.appendChild(coursesUl);
    list.appendChild(coursesLi);
  } else {
    const coursesLi = document.createElement('li');
    const coursesStrong = document.createElement('strong');
    coursesStrong.textContent = "Courses I\u2019m Taking & Why:";
    coursesLi.appendChild(coursesStrong);
    const coursesUl = document.createElement('ul');
    const course = (code, value) => {
      const cli = document.createElement('li');
      cli.textContent = `${code}: ${value || ''}`;
      coursesUl.appendChild(cli);
    };
    course('CRS101', data.crs101);
    course('CRS201', data.crs201);
    course('CRS330', data.crs330);
    coursesLi.appendChild(coursesUl);
    list.appendChild(coursesLi);
  }

  const rememberPieces = [];
  if (data.funnyRemember) rememberPieces.push(data.funnyRemember);
  if (data.funFact) rememberPieces.push(data.funFact);
  if (rememberPieces.length) addListItem('Remember me by:', rememberPieces.join(' — '));

  const additionalPieces = [];
  if (data.additionalInfo) additionalPieces.push(data.additionalInfo);
  if (data.otherNotes) additionalPieces.push(data.otherNotes);
  if (additionalPieces.length) addListItem('Additional:', additionalPieces.join(' — '));

  frag.appendChild(list);

  if (data.quoteText || data.quoteAuthor) {
    const p = document.createElement('p');
    p.className = 'centered';
    p.textContent = `"${data.quoteText || ''}"`;
    p.appendChild(document.createElement('br'));
    const dashAndAuthor = document.createElement('span');
    dashAndAuthor.innerHTML = '– ';
    const author = document.createElement('span');
    author.className = 'italic';
    author.textContent = data.quoteAuthor || '';
    p.appendChild(dashAndAuthor);
    p.appendChild(author);
    frag.appendChild(p);
  }

  if (data.languages) {
    frag.appendChild(el('p', null, `Languages: ${data.languages}`));
  }
  if (backup) {
    frag.appendChild(el('p', null, `Backup Plan: ${backup}`));
  }

  // render to output container
  output.innerHTML = '';
  output.appendChild(frag);

  // populate JSON and HTML code areas if present
  const jsonArea = document.getElementById('jsonOutput');
  const htmlArea = document.getElementById('htmlOutput');
  try {
    if (jsonArea) jsonArea.value = JSON.stringify(data, null, 2);
  } catch (err) {
    if (jsonArea) jsonArea.value = String(data);
  }
  if (htmlArea) htmlArea.value = output.innerHTML;
}
