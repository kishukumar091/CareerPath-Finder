// CareerPath Finder - Complete JavaScript

// API Base URL
const API_BASE_URL = 'http://localhost:7078/api';

// DOM Elements
let careerForm, resultsDiv, submitBtn, btnText;
let latestQuizResult = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  setupEventListeners();
});

function initializeApp() {
  // Get common DOM elements
  careerForm = document.getElementById('careerForm');
  resultsDiv = document.getElementById('results');
  submitBtn = document.getElementById('submitBtn');
  btnText = document.getElementById('btnText');

  // Setup navigation
  setupNavigation();
  updateAuthNavigation();
  
  // Setup mobile menu
  setupMobileMenu();
  
  // Setup authentication forms
  setupAuthForms();

  // Show stored quiz history when the quiz page is opened.
  renderSavedResultsSection();
  renderProfilePage();
  if (isUserLoggedIn()) {
    refreshSearchHistoryFromServer();
  }
}

function setupEventListeners() {
  // Career form submission
  if (careerForm) {
    careerForm.addEventListener('submit', handleCareerFormSubmit);
  }

  // Close modals when clicking outside
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      closeModal(e.target.id);
    }
  });

  // Escape key to close modals
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal.show');
      if (openModal) {
        closeModal(openModal.id);
      }
    }
  });

  document.addEventListener('click', function(e) {
    const saveButton = e.target.closest('#saveQuizResultBtn');
    if (saveButton) {
      e.preventDefault();
      handleSaveQuizResult();
    }

    const logoutButton = e.target.closest('[data-logout]');
    if (logoutButton) {
      e.preventDefault();
      logout();
    }

    const deleteButton = e.target.closest('[data-delete-result]');
    if (deleteButton) {
      e.preventDefault();
      deleteSavedResult(deleteButton.getAttribute('data-delete-result'));
    }
  });
}

function setupNavigation() {
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const navHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Update active navigation on scroll
  window.addEventListener('scroll', updateActiveNavigation);
}

function updateAuthNavigation() {
  const navLinks = document.getElementById('navLinks') || document.querySelector('.nav-links');
  if (!navLinks) return;

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const userData = getStoredUserData();
  const loggedIn = isUserLoggedIn() && userData;
  const baseLinks = [
    { href: 'index.html', label: 'Home' },
    { href: 'about.html', label: 'About' },
    { href: 'quiz.html', label: 'Find Career' }
  ];
  const accountLinks = loggedIn
    ? [
        { href: 'profile.html', label: getFirstName(userData.name), extraClass: 'nav-profile' },
        { href: '#', label: 'Logout', extraClass: 'nav-cta', attrs: 'data-logout="true"' }
      ]
    : [
        { href: 'signin.html', label: 'Sign In' },
        { href: 'register.html', label: 'Register', extraClass: 'nav-cta' }
      ];

  navLinks.innerHTML = [...baseLinks, ...accountLinks].map(link => {
    const active = link.href === currentPage ? ' active' : '';
    const extraClass = link.extraClass ? ` ${link.extraClass}` : '';
    const attrs = link.attrs ? ` ${link.attrs}` : '';
    return `<li><a href="${link.href}" class="nav-link${extraClass}${active}"${attrs}>${escapeHTML(link.label)}</a></li>`;
  }).join('');
}

function getFirstName(name) {
  return String(name || 'Profile').trim().split(/\s+/)[0] || 'Profile';
}

function updateActiveNavigation() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.getBoundingClientRect().top;
    if (sectionTop <= 100) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

function setupMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenu) {
    mobileMenu.addEventListener('click', function() {
      navLinks.classList.toggle('show');
      this.classList.toggle('active');
    });
  }
}

// Career Finding Functionality
async function handleCareerFormSubmit(e) {
  e.preventDefault();
  
  const formData = getFormData();
  if (!validateFormData(formData)) {
    showNotification('Please fill in all required fields!', 'error');
    return;
  }

  showLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/find-career`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const recommendations = await response.json();
      displayResults(recommendations, formData);
      latestQuizResult = createSearchEntry(formData, recommendations);
    } else {
      const errorMessage = await response.text();
      showNotification(`Error: ${errorMessage}`, 'error');
    }
  } catch (error) {
    console.error('Failed to fetch:', error);
    showNotification('Failed to fetch career recommendations. Please check your network.', 'error');
  } finally {
    showLoading(false);
  }
}

function getFormData() {
  return {
    hobby: document.getElementById('hobby')?.value.toLowerCase().trim() || '',
    dream: document.getElementById('dream')?.value.toLowerCase().trim() || '',
    aim: document.getElementById('aim')?.value.toLowerCase().trim() || '',
    skills: document.getElementById('skills')?.value.toLowerCase().trim() || ''
  };
}

function validateFormData(data) {
  return data.hobby && data.dream && data.aim;
}

function displayResults(matches, userInputs) {
  if (!resultsDiv) return;

  resultsDiv.style.display = 'block';
  
  if (matches.length === 0) {
    resultsDiv.innerHTML = createNoMatchesHTML();
    return;
  }

  let resultsHTML = createPersonalizedMessage(userInputs);
  
  matches.slice(0, 3).forEach((match, index) => {
    resultsHTML += createResultCard(match, index);
  });

  resultsHTML += createSaveResultPanel();

  resultsDiv.innerHTML = resultsHTML;
  animateResults();
  scrollToResults();
}

function createNoMatchesHTML() {
  return `
    <div class="result-card show">
      <h3>Let's Explore Together</h3>
      <p>We couldn't find specific matches for your unique combination of interests, but that doesn't mean there aren't amazing opportunities out there!</p>
      <div class="resources">
        <h4>General Career Resources:</h4>
        <div class="resource-links">
          <a href="https://www.mynextmove.org/" class="resource-link" target="_blank">Career Explorer</a>
          <a href="https://www.bls.gov/ooh/" class="resource-link" target="_blank">Occupational Outlook</a>
          <a href="https://www.16personalities.com/" class="resource-link" target="_blank">Personality Test</a>
          <a href="https://www.onetonline.org/" class="resource-link" target="_blank">O*NET Interest Profiler</a>
        </div>
      </div>
    </div>
  `;
}

function createPersonalizedMessage(userInputs) {
  return `
    <div class="result-card show" style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; text-align: center;">
      <h3>Your Personalized Career Recommendations</h3>
      <p>Based on your interests in <strong>${escapeHTML(userInputs.hobby)}</strong>, your dream of becoming a <strong>${escapeHTML(userInputs.dream)}</strong>, and your goal to <strong>${escapeHTML(userInputs.aim)}</strong>, here are your top career matches:</p>
    </div>
  `;
}

function createResultCard(match, index) {
  const topCareers = match.careers.slice(0, 4);
  const keywordCount = match.keywordCount || Math.max(match.foundKeywords.length, match.score, 1);
  const matchPercentage = Math.min(100, Math.round((match.score / keywordCount) * 100));
  const category = escapeHTML(match.category.charAt(0).toUpperCase() + match.category.slice(1));
  
  return `
    <div class="result-card" style="animation-delay: ${(index + 1) * 0.2}s">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3>${category} Careers</h3>
        <span style="background: linear-gradient(45deg, #ff6b6b, #feca57); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600; font-size: 0.9rem;">
          ${matchPercentage}% Match
        </span>
      </div>
      
      <div style="margin-bottom: 1rem;">
        <strong>Recommended Careers:</strong>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
          ${topCareers.map(career => 
            `<span style="background: #f0f0f0; padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.9rem; color: #333;">${escapeHTML(career)}</span>`
          ).join('')}
        </div>
      </div>
      
      <p style="margin-bottom: 1rem;"><strong>Why this fits:</strong> ${escapeHTML(match.description)}</p>
      
      <div style="margin-bottom: 1rem;">
        <strong>Matched Keywords:</strong>
        <div style="display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.5rem;">
          ${match.foundKeywords.slice(0, 6).map(keyword => 
            `<span style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.8rem;">${escapeHTML(keyword)}</span>`
          ).join('')}
        </div>
      </div>
      
      <div class="resources">
        <h4>Start Learning:</h4>
        <div class="resource-links">
          ${match.resources.slice(0, 4).map(resource => 
            `<a href="${escapeAttribute(resource.url)}" class="resource-link" target="_blank" rel="noopener noreferrer">${escapeHTML(resource.name)}</a>`
          ).join('')}
        </div>
      </div>
    </div>
  `;
}

function animateResults() {
  setTimeout(() => {
    document.querySelectorAll('.result-card:not(.show)').forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('show');
      }, index * 200);
    });
  }, 100);
}

function scrollToResults() {
  setTimeout(() => {
    resultsDiv.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, 800);
}

function showLoading(show) {
  if (!submitBtn || !btnText) return;
  
  if (show) {
    btnText.innerHTML = '<span class="loading"></span>Analyzing your interests...';
    submitBtn.disabled = true;
  } else {
    btnText.innerHTML = 'Find My Career Path';
    submitBtn.disabled = false;
  }
}

// Authentication System
function setupAuthForms() {
  // Sign In Form
  const signinForm = document.getElementById('signinForm');
  if (signinForm) {
    signinForm.addEventListener('submit', handleSignIn);
  }

  // Register Form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }

  // Modal triggers
  document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      const modalId = this.getAttribute('data-modal');
      openModal(modalId);
    });
  });
}

async function handleSignIn(e) {
  e.preventDefault();
  
  const email = document.getElementById('email')?.value;
  const password = document.getElementById('password')?.value;

  if (!email || !password) {
    showNotification('Please fill in all fields!', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/users/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const user = await response.json();
      setUserSession(user);
      await refreshSearchHistoryFromServer();
      showNotification(`Welcome back, ${user.name}!`, 'success');
      window.location.href = "profile.html";
    } else {
      const errorMessage = await response.text();
      showNotification(`Error: ${errorMessage}`, 'error');
    }
  } catch (error) {
    console.error('Failed to fetch:', error);
    showNotification('Sign-in failed. Please check your network and try again.', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('fullname')?.value;
  const email = document.getElementById('email')?.value;
  const password = document.getElementById('password')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;

  if (!name || !email || !password || !confirmPassword) {
    showNotification('Please fill in all fields!', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showNotification('Passwords do not match!', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
        joinDate: new Date().toISOString(),
        searchHistory: []
      }),
    });

    if (response.ok) {
      const successMessage = await response.text();
      showNotification(`Success: ${successMessage}`, 'success');
      // Redirect to signin page after successful registration
      setTimeout(() => {
        window.location.href = "signin.html";
      }, 1500);
    } else {
      const errorMessage = await response.text();
      showNotification(`Error: ${errorMessage}`, 'error');
    }
  } catch (error) {
    console.error('Failed to fetch:', error);
    showNotification('Registration failed. Please check your network and try again.', 'error');
  }
}


function setupNavigationEventListeners() {
  // Re-setup modal triggers
  document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      const modalId = this.getAttribute('data-modal');
      openModal(modalId);
    });
  });
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHTML(value).replaceAll('`', '&#096;');
}

// Modal Functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
  }
}

// Profile Functions
function showProfile() {
  const userData = getStoredUserData();
  if (!userData) {
    showNotification('Please sign in to view your profile.', 'info');
    return;
  }

  const profileModal = createProfileModal(userData);
  
  // Add modal to page if it doesn't exist
  if (!document.getElementById('profileModal')) {
    document.body.appendChild(profileModal);
  }
  
  openModal('profileModal');
}

function createProfileModal(userData) {
  const modal = document.createElement('div');
  modal.id = 'profileModal';
  modal.className = 'modal';
  
  const searchHistoryHTML = userData.searchHistory && userData.searchHistory.length > 0 
    ? userData.searchHistory.slice(-3).map((search, index) => `
        <div style="background: #f0f0f0; padding: 1rem; border-radius: 10px; margin-bottom: 0.5rem;">
          <strong>Search ${index + 1}:</strong> ${escapeHTML(search.hobby)}, ${escapeHTML(search.dream)}
          <br><small>${new Date(search.date).toLocaleDateString()}</small>
        </div>
      `).join('')
    : '<p>No search history yet. Try the career finder!</p>';

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close" onclick="closeModal('profileModal')">&times;</span>
      <h2>Your Profile</h2>
      <div style="text-align: left;">
        <p><strong>Name:</strong> ${escapeHTML(userData.name)}</p>
        <p><strong>Email:</strong> ${escapeHTML(userData.email)}</p>
        <p><strong>Member since:</strong> ${new Date(userData.joinDate).toLocaleDateString()}</p>
        
        <div style="margin-top: 2rem;">
          <h3>Recent Searches</h3>
          ${searchHistoryHTML}
        </div>
        
        <button onclick="logout()" class="submit-btn" style="margin-top: 2rem; background: linear-gradient(45deg, #ff6b6b, #feca57);">
          Logout
        </button>
      </div>
    </div>
  `;
  
  return modal;
}

function logout() {
  clearUserSession();
  showNotification('You have been logged out successfully!', 'info');
  closeModal('profileModal');
  updateUserState();
  
  // Remove profile modal from DOM
  const profileModal = document.getElementById('profileModal');
  if (profileModal) {
    profileModal.remove();
  }

  if (window.location.pathname.endsWith('profile.html')) {
    window.location.href = 'index.html';
  }
}

// User Data Management
function saveUserData(userData) {
  try {
    localStorage.setItem('careerPathUserData', JSON.stringify(userData));
  } catch (error) {
    console.error('Failed to save user data:', error);
  }
}

function getStoredUserData() {
  try {
    const data = localStorage.getItem('careerPathUserData');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to retrieve user data:', error);
    return null;
  }
}

function setUserSession(userData) {
  try {
    localStorage.setItem('careerPathLoggedIn', 'true');
    saveUserData(userData);
    updateAuthNavigation();
  } catch (error) {
    console.error('Failed to set user session:', error);
  }
}

function clearUserSession() {
  try {
    localStorage.removeItem('careerPathLoggedIn');
    localStorage.removeItem('careerPathUserData');
    updateAuthNavigation();
  } catch (error) {
    console.error('Failed to clear user session:', error);
  }
}

function isUserLoggedIn() {
  return localStorage.getItem('careerPathLoggedIn') === 'true';
}

function checkUserSession() {
  if (isUserLoggedIn()) {
    const userData = getStoredUserData();
    if (!userData) {
      clearUserSession();
    }
  }
}

function createSearchEntry(formData, matches) {
  return {
    ...formData,
    matchedCategories: matches.map(m => m.category),
    matches: matches.map(m => ({
      category: m.category,
      score: m.score,
      careers: m.careers?.slice(0, 4) || [],
      resources: m.resources?.slice(0, 4) || []
    })),
    date: new Date().toISOString()
  };
}

async function handleSaveQuizResult() {
  if (!latestQuizResult) {
    showNotification('Take the quiz first, then save the result.', 'info');
    return;
  }

  await saveSearchHistory(latestQuizResult);
}

async function saveSearchHistory(searchEntry) {
  if (!isUserLoggedIn()) return;
  
  const userData = getStoredUserData();
  if (!userData) return;
  
  userData.searchHistory = userData.searchHistory || [];
  userData.searchHistory.push(searchEntry);
  
  // Keep only last 10 searches
  if (userData.searchHistory.length > 10) {
    userData.searchHistory = userData.searchHistory.slice(-10);
  }
  
  saveUserData(userData);
  renderSavedResultsSection();
  renderProfilePage();

  try {
    const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userData.email)}/search-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchEntry),
    });

    if (response.ok) {
      userData.searchHistory = await response.json();
      saveUserData(userData);
      renderSavedResultsSection();
      renderProfilePage();
      latestQuizResult = null;
      showNotification('Quiz result saved to your account.', 'success');
    } else {
      const errorMessage = await response.text();
      showNotification(`Saved locally, but database save failed: ${errorMessage}`, 'error');
    }
  } catch (error) {
    console.error('Failed to save quiz result:', error);
    showNotification('Saved locally, but database save failed. Check your network.', 'error');
  }
}

async function refreshSearchHistoryFromServer() {
  const userData = getStoredUserData();
  if (!userData?.email) return;

  try {
    const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userData.email)}/search-history`);
    if (response.ok) {
      userData.searchHistory = await response.json();
      saveUserData(userData);
      renderSavedResultsSection();
      renderProfilePage();
    }
  } catch (error) {
    console.error('Failed to refresh quiz history:', error);
  }
}

async function deleteSavedResult(date) {
  const userData = getStoredUserData();
  if (!userData?.email || !date) return;

  const previousHistory = userData.searchHistory || [];
  userData.searchHistory = previousHistory.filter(item => item.date !== date);
  saveUserData(userData);
  renderSavedResultsSection();
  renderProfilePage();

  try {
    const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userData.email)}/search-history/${encodeURIComponent(date)}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      userData.searchHistory = await response.json();
      saveUserData(userData);
      renderSavedResultsSection();
      renderProfilePage();
      showNotification('Saved result deleted.', 'success');
    } else {
      userData.searchHistory = previousHistory;
      saveUserData(userData);
      renderSavedResultsSection();
      renderProfilePage();
      const errorMessage = await response.text();
      showNotification(`Delete failed: ${errorMessage}`, 'error');
    }
  } catch (error) {
    userData.searchHistory = previousHistory;
    saveUserData(userData);
    renderSavedResultsSection();
    renderProfilePage();
    console.error('Failed to delete quiz result:', error);
    showNotification('Delete failed. Check your network.', 'error');
  }
}

function renderSavedResultsSection() {
  const container = document.getElementById('savedResults');
  if (!container) return;

  if (!isUserLoggedIn()) {
    container.innerHTML = `
      <div class="saved-empty">
        <h3>Sign in to save your quiz results</h3>
        <p>Your completed quiz results will appear here after login and will stay available when you sign in again.</p>
        <a href="signin.html" class="secondary-dark-button">Sign In</a>
      </div>
    `;
    return;
  }

  const userData = getStoredUserData();
  const history = userData?.searchHistory || [];

  if (history.length === 0) {
    container.innerHTML = `
      <div class="saved-empty">
        <h3>No saved results yet</h3>
        <p>Take the quiz while signed in and your result will be saved here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = history
    .slice()
    .reverse()
    .map(createSavedResultCard)
    .join('');
}

function renderProfilePage() {
  const profileRoot = document.getElementById('profileRoot');
  if (!profileRoot) return;

  if (!isUserLoggedIn()) {
    profileRoot.innerHTML = `
      <section class="profile-shell">
        <div class="profile-empty">
          <p class="eyebrow">Profile</p>
          <h1>Please sign in to view your profile</h1>
          <p>Your account details and saved quiz results will appear here.</p>
          <a href="signin.html" class="cta-button">Sign In</a>
        </div>
      </section>
    `;
    return;
  }

  const userData = getStoredUserData();
  const history = userData?.searchHistory || [];
  const latest = history[history.length - 1];
  const favoriteField = getMostCommonCategory(history);

  profileRoot.innerHTML = `
    <section class="profile-shell">
      <div class="profile-hero-card">
        <div class="profile-avatar">${escapeHTML(getInitials(userData?.name))}</div>
        <div>
          <p class="eyebrow">Your profile</p>
          <h1>${escapeHTML(userData?.name || 'CareerPath User')}</h1>
          <p>${escapeHTML(userData?.email || '')}</p>
        </div>
        <button class="profile-logout-btn" data-logout="true" type="button">Logout</button>
      </div>

      <div class="profile-grid">
        <article class="profile-card">
          <h2>Account Details</h2>
          <dl class="profile-details">
            <div><dt>Name</dt><dd>${escapeHTML(userData?.name || '-')}</dd></div>
            <div><dt>Email</dt><dd>${escapeHTML(userData?.email || '-')}</dd></div>
            <div><dt>Member Since</dt><dd>${formatDate(userData?.joinDate)}</dd></div>
            <div><dt>Saved Results</dt><dd>${history.length}</dd></div>
          </dl>
        </article>

        <article class="profile-card profile-highlight">
          <h2>Career Snapshot</h2>
          <div class="snapshot-number">${escapeHTML(favoriteField || 'Explore')}</div>
          <p>${latest ? `Latest dream: ${escapeHTML(latest.dream || '-')}` : 'Save a quiz result to build your career snapshot.'}</p>
          <a href="quiz.html" class="secondary-dark-button">Take Quiz</a>
        </article>
      </div>

      <section class="profile-card profile-history">
        <div class="profile-history-heading">
          <div>
            <p class="eyebrow">Saved from quiz</p>
            <h2>Saved Quiz Results</h2>
          </div>
          <a href="quiz.html" class="secondary-dark-button">New Quiz</a>
        </div>
        <div class="saved-results profile-saved-results">
          ${history.length ? history.slice().reverse().map(createSavedResultCard).join('') : `
            <div class="saved-empty">
              <h3>No saved results yet</h3>
              <p>Take the career quiz and click Save Result to keep it here.</p>
            </div>
          `}
        </div>
      </section>
    </section>
  `;
}

function getInitials(name) {
  return String(name || 'CP')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('') || 'CP';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? escapeHTML(value) : date.toLocaleDateString();
}

function getMostCommonCategory(history) {
  const counts = {};
  history.forEach(item => {
    (item.matchedCategories || item.matches?.map(match => match.category) || []).forEach(category => {
      counts[category] = (counts[category] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function createSavedResultCard(search, index) {
  const date = search.date ? new Date(search.date).toLocaleString() : 'Recently';
  const matches = search.matches || [];
  const topMatch = matches[0];
  const categories = (search.matchedCategories || matches.map(match => match.category) || [])
    .slice(0, 4)
    .map(category => `<span>${escapeHTML(category)}</span>`)
    .join('');
  const careers = topMatch?.careers?.length
    ? topMatch.careers.slice(0, 4).map(career => `<span>${escapeHTML(career)}</span>`).join('')
    : '<span>Review your recommendations above</span>';
  const resources = matches
    .flatMap(match => match.resources || [])
    .slice(0, 4);
  const resourceLinks = resources.length
    ? resources.map(resource => `
        <a href="${escapeAttribute(resource.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(resource.name)}</a>
      `).join('')
    : '<p class="saved-muted">No course links saved for this older result. Take the quiz again and save it to include course links.</p>';

  return `
    <article class="saved-result-card" data-result-date="${escapeAttribute(search.date || '')}">
      <div class="saved-result-header">
        <div>
          <p class="saved-result-date">${escapeHTML(date)}</p>
          <h3>Quiz Result ${index + 1}</h3>
        </div>
        <div class="saved-result-actions">
          <strong>${escapeHTML(topMatch?.category || 'Career match')}</strong>
          <button class="delete-result-btn" data-delete-result="${escapeAttribute(search.date || '')}" type="button">Delete</button>
        </div>
      </div>
      <p><strong>Hobby:</strong> ${escapeHTML(search.hobby || '-')}</p>
      <p><strong>Dream:</strong> ${escapeHTML(search.dream || '-')}</p>
      <p><strong>Aim:</strong> ${escapeHTML(search.aim || '-')}</p>
      <div class="saved-tags">${categories}</div>
      <div class="saved-careers">${careers}</div>
      <div class="saved-resources">
        <h4>Required Courses</h4>
        <div class="saved-resource-links">${resourceLinks}</div>
      </div>
    </article>
  `;
}

function createSaveResultPanel() {
  if (isUserLoggedIn()) {
    return `
      <div class="result-card result-save-card show">
        <div>
          <h3>Save this quiz result</h3>
          <p>Add this result to your profile so it stays available after logout and login.</p>
        </div>
        <button class="save-result-btn" id="saveQuizResultBtn" type="button">Save Result</button>
      </div>
    `;
  }

  return `
    <div class="result-card result-save-card show">
      <div>
        <h3>Want to keep this result?</h3>
        <p>Sign in first, then save your quiz result to your profile.</p>
      </div>
      <a href="signin.html" class="save-result-btn">Sign In to Save</a>
    </div>
  `;
}

function updateUserState() {
  renderSavedResultsSection();
}

// Notification System
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
  }, 100);
  
  // Remove notification after 4 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

// Utility Functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Global Functions (accessible from HTML)
window.openModal = openModal;
window.closeModal = closeModal;
window.showProfile = showProfile;
window.logout = logout;

// Analytics (Optional - for tracking user interactions)
function trackEvent(eventName, eventData = {}) {
  // This is where you would integrate with analytics services like Google Analytics
  console.log('Event tracked:', eventName, eventData);
}

// Error Handling
window.addEventListener('error', function(event) {
  console.error('JavaScript error:', event.error);
  showNotification('Something went wrong. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  showNotification('Something went wrong. Please try again.', 'error');
});

// Performance Optimization
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // Preload resources or perform non-critical tasks
    console.log('App loaded and idle');
  });
}

// Service Worker Registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
