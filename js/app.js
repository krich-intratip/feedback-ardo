// ========================================
// Training Feedback Management System
// Main Application - Version 2.0.0
// ========================================

let feedbackData = [];
let barChartInstance = null;
let radarChartInstance = null;

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initTheme();
    showTab('form');
    initScrollEffects();
});

// ========================================
// THEME MANAGEMENT
// ========================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else if (!savedTheme) {
        // Detect system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    }
}

function toggleTheme() {
    // Add transition class for smooth theme change
    document.documentElement.classList.add('theme-transitioning');

    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Animate theme icon
    const icon = isDark
        ? document.getElementById('themeIconDark')
        : document.getElementById('themeIconLight');
    if (icon) {
        icon.classList.remove('icon-enter');
        void icon.offsetWidth; // force reflow
        icon.classList.add('icon-enter');
    }

    // Update charts if they exist
    if (barChartInstance || radarChartInstance) {
        renderCharts();
    }

    // Remove transition class after animation completes
    setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
    }, 600);
}

// ========================================
// SCROLL EFFECTS
// ========================================
function initScrollEffects() {
    const navbar = document.getElementById('navbar');
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    window.addEventListener('scroll', () => {
        // Navbar shadow on scroll
        if (navbar) {
            if (window.scrollY > 10) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }

        // Scroll-to-top button
        if (scrollTopBtn) {
            if (window.scrollY > 400) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        }
    }, { passive: true });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// TAB MANAGEMENT
// ========================================
function showTab(tabName) {
    const contentArea = document.getElementById('content-area');

    // Remove active from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('tab-active');
    });

    // Add active to selected tab
    const activeBtn = document.getElementById(`tab-${tabName}`);
    activeBtn.classList.add('tab-active');

    // Load content
    if (tabName === 'form') {
        contentArea.innerHTML = getFormHTML();
        setDefaultDate();
        initFormProgress();
    } else if (tabName === 'list') {
        contentArea.innerHTML = getListHTML();
        renderRecordsList();
    } else if (tabName === 'summary') {
        contentArea.innerHTML = getSummaryHTML();
        renderSummary();
    }
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('trainingDate');
    if (dateInput) dateInput.value = today;
}

// ========================================
// FORM PROGRESS BAR
// ========================================
function initFormProgress() {
    const form = document.querySelector('form');
    if (!form) return;

    const updateProgress = () => {
        const requiredInputs = form.querySelectorAll('[required]');
        let filled = 0;
        requiredInputs.forEach(input => {
            if (input.type === 'radio') {
                const name = input.name;
                if (form.querySelector(`input[name="${name}"]:checked`)) {
                    filled++;
                }
            } else if (input.value.trim()) {
                filled++;
            }
        });

        // Count unique radio groups
        const radioGroups = new Set();
        form.querySelectorAll('input[type="radio"][required]').forEach(r => radioGroups.add(r.name));
        const totalRequired = (requiredInputs.length - form.querySelectorAll('input[type="radio"][required]').length) + radioGroups.size;

        // Count filled radio groups
        let filledRadioGroups = 0;
        radioGroups.forEach(name => {
            if (form.querySelector(`input[name="${name}"]:checked`)) filledRadioGroups++;
        });

        let filledText = 0;
        form.querySelectorAll('input[type="text"][required], input[type="date"][required]').forEach(input => {
            if (input.value.trim()) filledText++;
        });

        const totalFilled = filledText + filledRadioGroups;
        const percent = totalRequired > 0 ? Math.round((totalFilled / totalRequired) * 100) : 0;

        const bar = document.getElementById('formProgressBar');
        const text = document.getElementById('formProgressText');
        if (bar) bar.style.width = `${percent}%`;
        if (text) text.textContent = `${percent}% completed`;
    };

    form.addEventListener('change', updateProgress);
    form.addEventListener('input', updateProgress);
    updateProgress();
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ========================================
// DATA MANAGEMENT
// ========================================
function loadData() {
    const stored = localStorage.getItem('feedbackData');
    if (stored) {
        try {
            feedbackData = JSON.parse(stored);
        } catch (e) {
            feedbackData = [];
            showToast('ข้อผิดพลาดในการโหลดข้อมูล', 'error');
        }
    }
}

function saveData() {
    try {
        localStorage.setItem('feedbackData', JSON.stringify(feedbackData));
        return true;
    } catch (e) {
        showToast('ไม่สามารถบันทึกข้อมูลได้', 'error');
        return false;
    }
}

function deleteRecord(id) {
    showConfirmModal(
        'ยืนยันการลบ',
        'คุณต้องการลบข้อมูลนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
        () => {
            feedbackData = feedbackData.filter(item => item.id !== id);
            if (saveData()) {
                showTab('list');
                showToast('ลบข้อมูลสำเร็จ', 'success');
            }
        }
    );
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ========================================
// FORM SUBMISSION
// ========================================
function submitFeedback(event) {
    event.preventDefault();

    const form = event.target;

    // Collect metadata
    const metadata = {
        courseName: form.courseName.value.trim(),
        trainingDate: form.trainingDate.value,
        location: form.location.value.trim(),
        batch: form.batch.value.trim(),
        department: form.department.value.trim()
    };

    // Collect ratings
    const ratings = {
        instructor: [
            parseInt(form.instructor_1.value),
            parseInt(form.instructor_2.value),
            parseInt(form.instructor_3.value),
            parseInt(form.instructor_4.value)
        ],
        content: [
            parseInt(form.content_1.value),
            parseInt(form.content_2.value),
            parseInt(form.content_3.value),
            parseInt(form.content_4.value)
        ],
        venue: [
            parseInt(form.venue_1.value),
            parseInt(form.venue_2.value),
            parseInt(form.venue_3.value)
        ],
        catering: [
            parseInt(form.catering_1.value),
            parseInt(form.catering_2.value),
            parseInt(form.catering_3.value)
        ],
        benefit: [
            parseInt(form.benefit_1.value),
            parseInt(form.benefit_2.value),
            parseInt(form.benefit_3.value)
        ]
    };

    // Collect open-ended
    const openEnded = {
        strengths: form.strengths.value.trim(),
        suggestions: form.suggestions.value.trim(),
        futureTopics: form.futureTopics.value.trim()
    };

    // Create record
    const record = {
        id: generateUUID(),
        createdAt: new Date().toISOString(),
        metadata,
        ratings,
        openEnded
    };

    // Save to array
    feedbackData.push(record);

    if (saveData()) {
        showToast('บันทึกข้อมูลสำเร็จ', 'success');
        form.reset();
        setDefaultDate();
        initFormProgress();

        // Trigger auto-save if enabled (async)
        if (window.autoSaveToCSV) {
            window.autoSaveToCSV(record).catch(err => {
                console.error('Auto-save error:', err);
            });
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ========================================
// FORM HTML TEMPLATE
// ========================================
function getFormHTML() {
    return `
    <div class="card p-4 sm:p-6 md:p-8 animate-fadeInUp">
        <form onsubmit="submitFeedback(event)" class="space-y-6">

            <!-- Form Progress -->
            <div>
                <div class="form-progress">
                    <div class="form-progress-bar" id="formProgressBar" style="width: 0%"></div>
                </div>
                <p class="form-progress-text" id="formProgressText">0% completed</p>
            </div>

            <!-- Metadata Section -->
            <div class="section-card animate-fadeInUp delay-1">
                <h2 class="section-title">📋 ข้อมูลการฝึกอบรม</h2>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">ชื่อหลักสูตร <span class="text-red-500">*</span></label>
                        <input type="text" name="courseName" required class="form-input"
                               placeholder="เช่น การพัฒนาภาวะผู้นำ">
                    </div>

                    <div>
                        <label class="form-label">วันที่อบรม <span class="text-red-500">*</span></label>
                        <input type="date" id="trainingDate" name="trainingDate" required class="form-input">
                    </div>

                    <div>
                        <label class="form-label">สถานที่ <span class="text-red-500">*</span></label>
                        <input type="text" name="location" required class="form-input"
                               placeholder="เช่น ห้องประชุม A">
                    </div>

                    <div>
                        <label class="form-label">รุ่น/ครั้งที่</label>
                        <input type="text" name="batch" class="form-input"
                               placeholder="เช่น รุ่นที่ 1">
                    </div>

                    <div class="sm:col-span-2">
                        <label class="form-label">หน่วยงาน</label>
                        <input type="text" name="department" class="form-input"
                               placeholder="เช่น ฝ่ายทรัพยากรบุคคล">
                    </div>
                </div>
            </div>

            <!-- Rating Sections -->
            ${getRatingSection('instructor', '👨‍🏫 วิทยากร', [
                'วิทยากรมีความรู้และประสบการณ์ในเนื้อหาที่สอน',
                'วิทยากรสามารถถ่ายทอดความรู้ได้ชัดเจนและเข้าใจง่าย',
                'วิทยากรมีปฏิสัมพันธ์กับผู้เข้าอบรมและตอบคำถามได้ดี',
                'วิทยากรมีบุคลิกภาพและท่วงทีที่เหมาะสม'
            ], 2)}

            ${getRatingSection('content', '📚 เนื้อหาและการจัดการอบรม', [
                'เนื้อหามีความเหมาะสมและตรงกับความต้องการ',
                'เนื้อหามีความทันสมัยและสามารถนำไปใช้ได้จริง',
                'กิจกรรมและแบบฝึกหัดมีความเหมาะสม',
                'ระยะเวลาในการอบรมมีความเหมาะสม'
            ], 3)}

            ${getRatingSection('venue', '🏢 สถานที่และสิ่งอำนวยความสะดวก', [
                'ห้องอบรมมีขนาดเหมาะสมและสะอาด',
                'อุปกรณ์การเรียนรู้มีความพร้อมและเพียงพอ',
                'สิ่งอำนวยความสะดวกโดยรวมมีความเหมาะสม'
            ], 4)}

            ${getRatingSection('catering', '🍽️ อาหารและเครื่องดื่ม', [
                'อาหารมีรสชาติดีและความหลากหลาย',
                'ปริมาณอาหารมีความเหมาะสม',
                'เครื่องดื่มและของว่างมีความเหมาะสม'
            ], 5)}

            ${getRatingSection('benefit', '💡 ประโยชน์และการนำไปใช้', [
                'ความรู้ที่ได้สามารถนำไปใช้ในการทำงานได้',
                'การอบรมช่วยพัฒนาทักษะที่จำเป็นต่อการทำงาน',
                'โดยรวมแล้วมีความพึงพอใจต่อการอบรมครั้งนี้'
            ], 6)}

            <!-- Open-ended Questions -->
            <div class="section-card animate-fadeInUp delay-6">
                <h2 class="section-title">💬 ข้อคิดเห็นและข้อเสนอแนะ</h2>

                <div class="space-y-4">
                    <div>
                        <label class="form-label">จุดเด่นของการอบรมครั้งนี้</label>
                        <textarea name="strengths" rows="3" class="form-input"
                                  placeholder="กรุณาระบุจุดเด่นหรือสิ่งที่ประทับใจ..."></textarea>
                    </div>

                    <div>
                        <label class="form-label">ข้อเสนอแนะในการปรับปรุง</label>
                        <textarea name="suggestions" rows="3" class="form-input"
                                  placeholder="กรุณาระบุสิ่งที่ควรปรับปรุงหรือพัฒนา..."></textarea>
                    </div>

                    <div>
                        <label class="form-label">หัวข้อที่สนใจในการอบรมครั้งต่อไป</label>
                        <textarea name="futureTopics" rows="3" class="form-input"
                                  placeholder="กรุณาระบุหัวข้อที่ต้องการเรียนรู้เพิ่มเติม..."></textarea>
                    </div>
                </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-center pt-4 animate-fadeInUp delay-6">
                <button type="submit" class="btn-primary">
                    <span>💾</span>
                    <span>บันทึกแบบประเมิน</span>
                </button>
            </div>
        </form>
    </div>
    `;
}

function getRatingSection(name, title, questions, delayNum) {
    const delayClass = delayNum ? `delay-${delayNum}` : '';
    return `
    <div class="section-card animate-fadeInUp ${delayClass}">
        <h2 class="section-title">${title}</h2>

        <div class="space-y-3">
            ${questions.map((question, index) => `
                <div class="question-card">
                    <p class="text-sm sm:text-base font-medium mb-3" style="color: var(--text-primary)">${index + 1}. ${question}</p>
                    <div class="flex flex-wrap items-center gap-3 sm:gap-4">
                        ${[1, 2, 3, 4, 5].map(rating => `
                            <label class="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                                <input type="radio" name="${name}_${index + 1}" value="${rating}" required class="rating-radio">
                                <span class="rating-label">${rating}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="mt-2 flex justify-between text-[11px]" style="color: var(--text-tertiary)">
                        <span>น้อยที่สุด</span>
                        <span>มากที่สุด</span>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    `;
}

// ========================================
// LIST HTML TEMPLATE
// ========================================
function getListHTML() {
    return `
    <div class="card p-4 sm:p-6 md:p-8 animate-fadeInUp">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 class="section-title" style="margin-bottom: 0;">📋 รายการผลประเมินทั้งหมด</h2>
            <div class="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                <button onclick="exportJSON()" class="btn-secondary flex-1 sm:flex-none" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;">
                    📥 Export JSON
                </button>
                <button onclick="exportCSV()" class="btn-secondary flex-1 sm:flex-none" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">
                    📊 Export CSV
                </button>
                <label class="btn-secondary flex-1 sm:flex-none cursor-pointer text-center" style="background: var(--gradient-primary); color: white;">
                    📤 Import JSON
                    <input type="file" accept=".json" onchange="importJSON(event)" class="hidden">
                </label>
            </div>
        </div>

        <div class="mb-4 text-sm" style="color: var(--text-secondary)">
            ทั้งหมด <span class="font-bold text-gradient">${feedbackData.length}</span> รายการ
        </div>

        <div class="table-responsive overflow-x-auto">
            <table id="recordsTable" class="data-table">
                <thead>
                    <tr>
                        <th>วันที่บันทึก</th>
                        <th>ชื่อหลักสูตร</th>
                        <th>วันที่อบรม</th>
                        <th>สถานที่</th>
                        <th style="text-align: center;">คะแนนเฉลี่ย</th>
                        <th style="text-align: center;">จัดการ</th>
                    </tr>
                </thead>
                <tbody id="recordsTableBody">
                    <!-- Records will be inserted here -->
                </tbody>
            </table>
        </div>
    </div>
    `;
}

function renderRecordsList() {
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;

    if (feedbackData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <p class="empty-state-title">ยังไม่มีข้อมูล</p>
                        <p class="empty-state-text">กรุณากรอกแบบประเมินเพื่อเริ่มต้น</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = feedbackData
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(record => {
            const avgScore = calculateAverageScore(record.ratings);
            const createdDate = new Date(record.createdAt).toLocaleString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            const trainingDate = new Date(record.metadata.trainingDate).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            return `
                <tr>
                    <td>${escapeHtml(createdDate)}</td>
                    <td><strong>${escapeHtml(record.metadata.courseName)}</strong></td>
                    <td>${escapeHtml(trainingDate)}</td>
                    <td>${escapeHtml(record.metadata.location)}</td>
                    <td style="text-align: center;">
                        <span class="score-badge ${getScoreClass(avgScore)}">
                            ${avgScore.toFixed(2)}
                        </span>
                    </td>
                    <td style="text-align: center;">
                        <div class="flex justify-center gap-2">
                            <button onclick="viewRecord('${escapeHtml(record.id)}')" class="btn-action btn-view">
                                👁️ ดู
                            </button>
                            <button onclick="deleteRecord('${escapeHtml(record.id)}')" class="btn-action btn-delete">
                                🗑️ ลบ
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
}

function calculateAverageScore(ratings) {
    const allScores = [
        ...ratings.instructor,
        ...ratings.content,
        ...ratings.venue,
        ...ratings.catering,
        ...ratings.benefit
    ];
    return allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
}

function getScoreClass(score) {
    if (score >= 4.5) return 'score-excellent';
    if (score >= 3.5) return 'score-good';
    if (score >= 2.5) return 'score-average';
    return 'score-poor';
}

function viewRecord(id) {
    const record = feedbackData.find(r => r.id === id);
    if (!record) return;

    const createdDate = new Date(record.createdAt).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const trainingDate = new Date(record.metadata.trainingDate).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const avgScore = calculateAverageScore(record.ratings);

    const modalHTML = `
        <div class="modal-backdrop" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="section-title" style="margin-bottom: 0; font-size: 1.25rem;">📄 รายละเอียดผลประเมิน</h2>
                    <button onclick="closeModal()" style="color: var(--text-tertiary); font-size: 1.5rem; cursor: pointer; background: none; border: none; padding: 4px;" onmouseover="this.style.color='var(--text-primary)'" onmouseout="this.style.color='var(--text-tertiary)'">&times;</button>
                </div>

                <div class="space-y-4">
                    <!-- Metadata -->
                    <div class="modal-section">
                        <h3 class="font-bold mb-3" style="color: var(--text-primary)">📋 ข้อมูลการอบรม</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm" style="color: var(--text-secondary)">
                            <p><strong>ชื่อหลักสูตร:</strong> ${escapeHtml(record.metadata.courseName)}</p>
                            <p><strong>วันที่อบรม:</strong> ${escapeHtml(trainingDate)}</p>
                            <p><strong>สถานที่:</strong> ${escapeHtml(record.metadata.location)}</p>
                            <p><strong>รุ่น:</strong> ${escapeHtml(record.metadata.batch) || '-'}</p>
                            <p><strong>หน่วยงาน:</strong> ${escapeHtml(record.metadata.department) || '-'}</p>
                            <p><strong>วันที่บันทึก:</strong> ${escapeHtml(createdDate)}</p>
                        </div>
                    </div>

                    <!-- Ratings -->
                    <div class="modal-section">
                        <h3 class="font-bold mb-3" style="color: var(--text-primary)">⭐ คะแนนประเมิน (เฉลี่ย: ${avgScore.toFixed(2)}/5.00)</h3>
                        <div class="space-y-2 text-sm" style="color: var(--text-secondary)">
                            <p><strong>วิทยากร:</strong> ${calculateCategoryAverage(record.ratings.instructor).toFixed(2)}/5.00</p>
                            <p><strong>เนื้อหา:</strong> ${calculateCategoryAverage(record.ratings.content).toFixed(2)}/5.00</p>
                            <p><strong>สถานที่:</strong> ${calculateCategoryAverage(record.ratings.venue).toFixed(2)}/5.00</p>
                            <p><strong>อาหาร:</strong> ${calculateCategoryAverage(record.ratings.catering).toFixed(2)}/5.00</p>
                            <p><strong>ประโยชน์:</strong> ${calculateCategoryAverage(record.ratings.benefit).toFixed(2)}/5.00</p>
                        </div>
                    </div>

                    <!-- Open-ended -->
                    <div class="modal-section">
                        <h3 class="font-bold mb-3" style="color: var(--text-primary)">💬 ข้อคิดเห็น</h3>
                        <div class="space-y-2 text-sm" style="color: var(--text-secondary)">
                            <p><strong>จุดเด่น:</strong> ${escapeHtml(record.openEnded.strengths) || '-'}</p>
                            <p><strong>ข้อเสนอแนะ:</strong> ${escapeHtml(record.openEnded.suggestions) || '-'}</p>
                            <p><strong>หัวข้อในอนาคต:</strong> ${escapeHtml(record.openEnded.futureTopics) || '-'}</p>
                        </div>
                    </div>
                </div>

                <div class="mt-6 flex justify-end">
                    <button onclick="closeModal()" class="btn-secondary" style="background: var(--bg-surface-hover); color: var(--text-primary); border: 1px solid var(--border-default);">
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalsContainer').innerHTML = modalHTML;
}

function calculateCategoryAverage(scores) {
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function closeModal() {
    document.getElementById('modalsContainer').innerHTML = '';
}

// ========================================
// SUMMARY HTML TEMPLATE
// ========================================
function getSummaryHTML() {
    return `
    <div class="space-y-6 animate-fadeInUp">
        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="stat-card card-hover animate-fadeInUp delay-1" style="background: linear-gradient(135deg, #7c5cfc, #6d3ef2); color: white;">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs sm:text-sm font-semibold" style="opacity: 0.85">จำนวนผลประเมิน</p>
                        <p class="stat-value mt-1" id="stat-total">0</p>
                    </div>
                    <div class="stat-icon">📊</div>
                </div>
            </div>

            <div class="stat-card card-hover animate-fadeInUp delay-2" style="background: linear-gradient(135deg, #ec4899, #db2777); color: white;">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs sm:text-sm font-semibold" style="opacity: 0.85">คะแนนเฉลี่ยรวม</p>
                        <p class="stat-value mt-1" id="stat-avg">0.00</p>
                    </div>
                    <div class="stat-icon">⭐</div>
                </div>
            </div>

            <div class="stat-card card-hover animate-fadeInUp delay-3" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs sm:text-sm font-semibold" style="opacity: 0.85">คะแนนสูงสุด</p>
                        <p class="stat-value mt-1" id="stat-max">0.00</p>
                    </div>
                    <div class="stat-icon">🏆</div>
                </div>
            </div>

            <div class="stat-card card-hover animate-fadeInUp delay-4" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs sm:text-sm font-semibold" style="opacity: 0.85">คะแนนต่ำสุด</p>
                        <p class="stat-value mt-1" id="stat-min">0.00</p>
                    </div>
                    <div class="stat-icon">📉</div>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="chart-card animate-fadeInUp delay-5">
                <h3 class="chart-title">📊 คะแนนเฉลี่ยแต่ละหมวด</h3>
                <canvas id="barChart"></canvas>
            </div>

            <div class="chart-card animate-fadeInUp delay-6">
                <h3 class="chart-title">🎯 แผนภูมิเรดาร์</h3>
                <canvas id="radarChart"></canvas>
            </div>
        </div>
    </div>
    `;
}

// ========================================
// ANIMATED NUMBER COUNTER
// ========================================
function animateValue(element, start, end, duration, isFloat = false) {
    const startTime = performance.now();

    const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * eased;

        element.textContent = isFloat ? current.toFixed(2) : Math.round(current);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    };

    requestAnimationFrame(update);
}

function renderSummary() {
    if (feedbackData.length === 0) {
        document.getElementById('stat-total').textContent = '0';
        document.getElementById('stat-avg').textContent = '0.00';
        document.getElementById('stat-max').textContent = '0.00';
        document.getElementById('stat-min').textContent = '0.00';
        return;
    }

    // Calculate statistics
    const scores = feedbackData.map(record => calculateAverageScore(record.ratings));
    const total = feedbackData.length;
    const avg = scores.reduce((sum, score) => sum + score, 0) / total;
    const max = Math.max(...scores);
    const min = Math.min(...scores);

    // Animate numbers
    const totalEl = document.getElementById('stat-total');
    const avgEl = document.getElementById('stat-avg');
    const maxEl = document.getElementById('stat-max');
    const minEl = document.getElementById('stat-min');

    animateValue(totalEl, 0, total, 800);
    animateValue(avgEl, 0, avg, 1000, true);
    animateValue(maxEl, 0, max, 1000, true);
    animateValue(minEl, 0, min, 1000, true);

    // Render charts
    renderCharts();
}

function renderCharts() {
    if (feedbackData.length === 0) return;

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? '#1e293b' : '#e2e8f0';

    // Calculate category averages
    const categories = {
        'วิทยากร': [],
        'เนื้อหา': [],
        'สถานที่': [],
        'อาหาร': [],
        'ประโยชน์': []
    };

    feedbackData.forEach(record => {
        categories['วิทยากร'].push(calculateCategoryAverage(record.ratings.instructor));
        categories['เนื้อหา'].push(calculateCategoryAverage(record.ratings.content));
        categories['สถานที่'].push(calculateCategoryAverage(record.ratings.venue));
        categories['อาหาร'].push(calculateCategoryAverage(record.ratings.catering));
        categories['ประโยชน์'].push(calculateCategoryAverage(record.ratings.benefit));
    });

    const labels = Object.keys(categories);
    const data = labels.map(label => {
        const scores = categories[label];
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    const chartColors = [
        { bg: 'rgba(124, 92, 252, 0.75)', border: 'rgba(124, 92, 252, 1)' },
        { bg: 'rgba(236, 72, 153, 0.75)', border: 'rgba(236, 72, 153, 1)' },
        { bg: 'rgba(59, 130, 246, 0.75)', border: 'rgba(59, 130, 246, 1)' },
        { bg: 'rgba(16, 185, 129, 0.75)', border: 'rgba(16, 185, 129, 1)' },
        { bg: 'rgba(251, 146, 60, 0.75)', border: 'rgba(251, 146, 60, 1)' }
    ];

    // Bar Chart
    const barCtx = document.getElementById('barChart');
    if (!barCtx) return;

    if (barChartInstance) barChartInstance.destroy();

    barChartInstance = new Chart(barCtx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'คะแนนเฉลี่ย',
                data: data,
                backgroundColor: chartColors.map(c => c.bg),
                borderColor: chartColors.map(c => c.border),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: { family: "'Inter', 'Noto Sans Thai', sans-serif", weight: '600' }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        color: textColor,
                        font: { family: "'Inter', sans-serif" }
                    },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: {
                        color: textColor,
                        font: { family: "'Noto Sans Thai', sans-serif" }
                    },
                    grid: { color: gridColor }
                }
            }
        }
    });

    // Radar Chart
    const radarCtx = document.getElementById('radarChart');
    if (!radarCtx) return;

    if (radarChartInstance) radarChartInstance.destroy();

    radarChartInstance = new Chart(radarCtx.getContext('2d'), {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'คะแนนเฉลี่ย',
                data: data,
                backgroundColor: isDark ? 'rgba(124, 92, 252, 0.2)' : 'rgba(124, 92, 252, 0.15)',
                borderColor: 'rgba(124, 92, 252, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(124, 92, 252, 1)',
                pointBorderColor: isDark ? '#131825' : '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: 'rgba(124, 92, 252, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: { family: "'Inter', 'Noto Sans Thai', sans-serif", weight: '600' }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        color: textColor,
                        stepSize: 1,
                        backdropColor: 'transparent',
                        font: { family: "'Inter', sans-serif" }
                    },
                    grid: { color: gridColor },
                    pointLabels: {
                        color: textColor,
                        font: { family: "'Noto Sans Thai', sans-serif", size: 13, weight: '600' }
                    }
                }
            }
        }
    });
}

// ========================================
// EXPORT / IMPORT FUNCTIONS
// ========================================
function exportJSON() {
    if (feedbackData.length === 0) {
        showToast('ไม่มีข้อมูลให้ Export', 'warning');
        return;
    }

    const dataStr = JSON.stringify(feedbackData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Export JSON สำเร็จ', 'success');
}

function exportCSV() {
    if (feedbackData.length === 0) {
        showToast('ไม่มีข้อมูลให้ Export', 'warning');
        return;
    }

    const csvContent = generateCSVContent();

    // UTF-8 with BOM
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Export CSV สำเร็จ', 'success');
}

function generateCSVContent() {
    const headers = [
        'วันที่บันทึก', 'ชื่อหลักสูตร', 'วันที่อบรม', 'สถานที่', 'รุ่น', 'หน่วยงาน',
        'วิทยากร_1', 'วิทยากร_2', 'วิทยากร_3', 'วิทยากร_4',
        'เนื้อหา_1', 'เนื้อหา_2', 'เนื้อหา_3', 'เนื้อหา_4',
        'สถานที่_1', 'สถานที่_2', 'สถานที่_3',
        'อาหาร_1', 'อาหาร_2', 'อาหาร_3',
        'ประโยชน์_1', 'ประโยชน์_2', 'ประโยชน์_3',
        'คะแนนเฉลี่ย', 'จุดเด่น', 'ข้อเสนอแนะ', 'หัวข้อในอนาคต'
    ];

    const rows = feedbackData.map(record => {
        const avgScore = calculateAverageScore(record.ratings);
        return [
            new Date(record.createdAt).toLocaleString('th-TH'),
            record.metadata.courseName,
            new Date(record.metadata.trainingDate).toLocaleDateString('th-TH'),
            record.metadata.location,
            record.metadata.batch || '',
            record.metadata.department || '',
            ...record.ratings.instructor,
            ...record.ratings.content,
            ...record.ratings.venue,
            ...record.ratings.catering,
            ...record.ratings.benefit,
            avgScore.toFixed(2),
            `"${(record.openEnded.strengths || '').replace(/"/g, '""')}"`,
            `"${(record.openEnded.suggestions || '').replace(/"/g, '""')}"`,
            `"${(record.openEnded.futureTopics || '').replace(/"/g, '""')}"`
        ];
    });

    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) {
                showToast('รูปแบบไฟล์ไม่ถูกต้อง', 'error');
                return;
            }

            // Validate and merge
            const validRecords = imported.filter(record =>
                record.id && record.metadata && record.ratings && record.openEnded
            );

            if (validRecords.length === 0) {
                showToast('ไม่พบข้อมูลที่ถูกต้องในไฟล์', 'error');
                return;
            }

            // Merge without duplicates
            const existingIds = new Set(feedbackData.map(r => r.id));
            const newRecords = validRecords.filter(r => !existingIds.has(r.id));

            feedbackData.push(...newRecords);
            if (saveData()) {
                showTab('list');
                showToast(`Import สำเร็จ ${newRecords.length} รายการ`, 'success');
            }

        } catch (error) {
            showToast('เกิดข้อผิดพลาดในการอ่านไฟล์', 'error');
        }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
}

// ========================================
// TOAST NOTIFICATIONS
// ========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    const colors = {
        success: 'linear-gradient(135deg, #10b981, #059669)',
        error: 'linear-gradient(135deg, #ef4444, #dc2626)',
        warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
        info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    };

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.background = colors[type];
    toast.innerHTML = `
        <div class="toast-body">
            <span style="font-size: 1.25rem;">${icons[type]}</span>
            <span>${message}</span>
        </div>
        <div class="toast-progress"></div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========================================
// CONFIRMATION MODAL
// ========================================
function showConfirmModal(title, message, onConfirm) {
    const modalHTML = `
        <div class="modal-backdrop" onclick="closeModal()">
            <div class="modal-content" style="max-width: 28rem;" onclick="event.stopPropagation()">
                <h2 class="section-title" style="font-size: 1.15rem;">${title}</h2>
                <p class="mb-6 text-sm" style="color: var(--text-secondary)">${message}</p>
                <div class="flex justify-end gap-3">
                    <button onclick="closeModal()" class="btn-secondary" style="background: var(--bg-surface-hover); color: var(--text-primary); border: 1px solid var(--border-default);">
                        ยกเลิก
                    </button>
                    <button onclick="confirmAction()" class="btn-secondary" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white;">
                        ยืนยัน
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalsContainer').innerHTML = modalHTML;

    window.confirmAction = function() {
        onConfirm();
        closeModal();
    };
}

// ========================================
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ========================================
window.showTab = showTab;
window.toggleTheme = toggleTheme;
window.submitFeedback = submitFeedback;
window.deleteRecord = deleteRecord;
window.viewRecord = viewRecord;
window.closeModal = closeModal;
window.exportJSON = exportJSON;
window.exportCSV = exportCSV;
window.importJSON = importJSON;
window.generateCSVContent = generateCSVContent;
window.showToast = showToast;
window.scrollToTop = scrollToTop;
