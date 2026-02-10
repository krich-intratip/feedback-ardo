// ========================================
// Training Feedback Management System
// Main Application - Version 1.0.0
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
});

// ========================================
// THEME MANAGEMENT
// ========================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Update charts if they exist
    if (barChartInstance || radarChartInstance) {
        renderCharts();
    }
}

// ========================================
// TAB MANAGEMENT
// ========================================
function showTab(tabName) {
    const contentArea = document.getElementById('content-area');

    // Remove active from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('tab-active', 'bg-gradient-to-r', 'from-purple-500', 'to-pink-500', 'text-white');
        btn.classList.add('text-gray-700', 'dark:text-gray-300');
    });

    // Add active to selected tab
    const activeBtn = document.getElementById(`tab-${tabName}`);
    activeBtn.classList.add('tab-active', 'bg-gradient-to-r', 'from-purple-500', 'to-pink-500', 'text-white');
    activeBtn.classList.remove('text-gray-700', 'dark:text-gray-300');

    // Load content
    if (tabName === 'form') {
        contentArea.innerHTML = getFormHTML();
        setDefaultDate();
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
            saveData();
            renderRecordsList();
            showToast('ลบข้อมูลสำเร็จ', 'success');
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

        // Trigger auto-save if enabled
        if (window.autoSaveToCSV) {
            window.autoSaveToCSV(record);
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
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 animate-fadeIn">
        <form onsubmit="submitFeedback(event)" class="space-y-6">

            <!-- Metadata Section -->
            <div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 sm:p-6 space-y-4">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4">📋 ข้อมูลการฝึกอบรม</h2>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ชื่อหลักสูตร <span class="text-red-500">*</span></label>
                        <input type="text" name="courseName" required
                               class="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                               placeholder="เช่น การพัฒนาภาวะผู้นำ">
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">วันที่อบรม <span class="text-red-500">*</span></label>
                        <input type="date" id="trainingDate" name="trainingDate" required
                               class="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300">
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">สถานที่ <span class="text-red-500">*</span></label>
                        <input type="text" name="location" required
                               class="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                               placeholder="เช่น ห้องประชุม A">
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">รุ่น/ครั้งที่</label>
                        <input type="text" name="batch"
                               class="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                               placeholder="เช่น รุ่นที่ 1">
                    </div>

                    <div class="sm:col-span-2">
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">หน่วยงาน</label>
                        <input type="text" name="department"
                               class="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
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
            ])}

            ${getRatingSection('content', '📚 เนื้อหาและการจัดการอบรม', [
                'เนื้อหามีความเหมาะสมและตรงกับความต้องการ',
                'เนื้อหามีความทันสมัยและสามารถนำไปใช้ได้จริง',
                'กิจกรรมและแบบฝึกหัดมีความเหมาะสม',
                'ระยะเวลาในการอบรมมีความเหมาะสม'
            ])}

            ${getRatingSection('venue', '🏢 สถานที่และสิ่งอำนวยความสะดวก', [
                'ห้องอบรมมีขนาดเหมาะสมและสะอาด',
                'อุปกรณ์การเรียนรู้มีความพร้อมและเพียงพอ',
                'สิ่งอำนวยความสะดวกโดยรวมมีความเหมาะสม'
            ])}

            ${getRatingSection('catering', '🍽️ อาหารและเครื่องดื่ม', [
                'อาหารมีรสชาติดีและความหลากหลาย',
                'ปริมาณอาหารมีความเหมาะสม',
                'เครื่องดื่มและของว่างมีความเหมาะสม'
            ])}

            ${getRatingSection('benefit', '💡 ประโยชน์และการนำไปใช้', [
                'ความรู้ที่ได้สามารถนำไปใช้ในการทำงานได้',
                'การอบรมช่วยพัฒนาทักษะที่จำเป็นต่อการทำงาน',
                'โดยรวมแล้วมีความพึงพอใจต่อการอบรมครั้งนี้'
            ])}

            <!-- Open-ended Questions -->
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 sm:p-6 space-y-4">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4">💬 ข้อคิดเห็นและข้อเสนอแนะ</h2>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">จุดเด่นของการอบรมครั้งนี้</label>
                    <textarea name="strengths" rows="3"
                              class="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                              placeholder="กรุณาระบุจุดเด่นหรือสิ่งที่ประทับใจ..."></textarea>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ข้อเสนอแนะในการปรับปรุง</label>
                    <textarea name="suggestions" rows="3"
                              class="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                              placeholder="กรุณาระบุสิ่งที่ควรปรับปรุงหรือพัฒนา..."></textarea>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">หัวข้อที่สนใจในการอบรมครั้งต่อไป</label>
                    <textarea name="futureTopics" rows="3"
                              class="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                              placeholder="กรุณาระบุหัวข้อที่ต้องการเรียนรู้เพิ่มเติม..."></textarea>
                </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-center pt-4">
                <button type="submit"
                        class="btn-primary bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 sm:px-12 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-base sm:text-lg">
                    <span class="flex items-center gap-2">
                        <span>💾</span>
                        <span>บันทึกแบบประเมิน</span>
                    </span>
                </button>
            </div>
        </form>
    </div>
    `;
}

function getRatingSection(name, title, questions) {
    return `
    <div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 sm:p-6 space-y-4">
        <h2 class="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4">${title}</h2>

        <div class="space-y-4">
            ${questions.map((question, index) => `
                <div class="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                    <p class="text-sm sm:text-base text-gray-800 dark:text-gray-200 mb-3 font-medium">${index + 1}. ${question}</p>
                    <div class="flex flex-wrap items-center gap-2 sm:gap-4">
                        ${[1, 2, 3, 4, 5].map(rating => `
                            <label class="flex items-center gap-1 sm:gap-2 cursor-pointer group">
                                <input type="radio" name="${name}_${index + 1}" value="${rating}" required class="rating-radio">
                                <span class="rating-label text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 font-medium">${rating}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
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
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 animate-fadeIn">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">📋 รายการผลประเมินทั้งหมด</h2>
            <div class="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                <button onclick="exportJSON()"
                        class="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 text-sm sm:text-base">
                    📥 Export JSON
                </button>
                <button onclick="exportCSV()"
                        class="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 text-sm sm:text-base">
                    📊 Export CSV
                </button>
                <label class="flex-1 sm:flex-none px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer text-sm sm:text-base text-center">
                    📤 Import JSON
                    <input type="file" accept=".json" onchange="importJSON(event)" class="hidden">
                </label>
            </div>
        </div>

        <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
            ทั้งหมด <span class="font-bold text-purple-600 dark:text-purple-400">${feedbackData.length}</span> รายการ
        </div>

        <div class="table-responsive overflow-x-auto">
            <table id="recordsTable" class="w-full min-w-full">
                <thead class="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <tr>
                        <th class="px-3 py-3 text-left text-xs sm:text-sm font-semibold">วันที่บันทึก</th>
                        <th class="px-3 py-3 text-left text-xs sm:text-sm font-semibold">ชื่อหลักสูตร</th>
                        <th class="px-3 py-3 text-left text-xs sm:text-sm font-semibold">วันที่อบรม</th>
                        <th class="px-3 py-3 text-left text-xs sm:text-sm font-semibold">สถานที่</th>
                        <th class="px-3 py-3 text-center text-xs sm:text-sm font-semibold">คะแนนเฉลี่ย</th>
                        <th class="px-3 py-3 text-center text-xs sm:text-sm font-semibold">จัดการ</th>
                    </tr>
                </thead>
                <tbody id="recordsTableBody" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
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
                <td colspan="6" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div class="flex flex-col items-center gap-3">
                        <span class="text-4xl">📭</span>
                        <p class="text-base sm:text-lg font-semibold">ยังไม่มีข้อมูล</p>
                        <p class="text-sm">กรุณากรอกแบบประเมินเพื่อเริ่มต้น</p>
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
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <td class="px-3 py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100">${createdDate}</td>
                    <td class="px-3 py-3 text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">${record.metadata.courseName}</td>
                    <td class="px-3 py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100">${trainingDate}</td>
                    <td class="px-3 py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100">${record.metadata.location}</td>
                    <td class="px-3 py-3 text-center">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs sm:text-sm font-bold ${getScoreColorClass(avgScore)}">
                            ${avgScore.toFixed(2)}
                        </span>
                    </td>
                    <td class="px-3 py-3 text-center">
                        <div class="flex justify-center gap-2">
                            <button onclick="viewRecord('${record.id}')"
                                    class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs sm:text-sm font-semibold transition-colors duration-200">
                                👁️ ดู
                            </button>
                            <button onclick="deleteRecord('${record.id}')"
                                    class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs sm:text-sm font-semibold transition-colors duration-200">
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

function getScoreColorClass(score) {
    if (score >= 4.5) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 3.5) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (score >= 2.5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
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
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">📄 รายละเอียดผลประเมิน</h2>
                    <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">&times;</button>
                </div>

                <div class="space-y-4 max-h-96 overflow-y-auto">
                    <!-- Metadata -->
                    <div class="bg-purple-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 class="font-bold text-gray-800 dark:text-white mb-3">📋 ข้อมูลการอบรม</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <p class="text-gray-700 dark:text-gray-300"><strong>ชื่อหลักสูตร:</strong> ${record.metadata.courseName}</p>
                            <p class="text-gray-700 dark:text-gray-300"><strong>วันที่อบรม:</strong> ${trainingDate}</p>
                            <p class="text-gray-700 dark:text-gray-300"><strong>สถานที่:</strong> ${record.metadata.location}</p>
                            <p class="text-gray-700 dark:text-gray-300"><strong>รุ่น:</strong> ${record.metadata.batch || '-'}</p>
                            <p class="text-gray-700 dark:text-gray-300"><strong>หน่วยงาน:</strong> ${record.metadata.department || '-'}</p>
                            <p class="text-gray-700 dark:text-gray-300"><strong>วันที่บันทึก:</strong> ${createdDate}</p>
                        </div>
                    </div>

                    <!-- Ratings -->
                    <div class="bg-blue-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 class="font-bold text-gray-800 dark:text-white mb-3">⭐ คะแนนประเมิน (เฉลี่ย: ${avgScore.toFixed(2)}/5.00)</h3>
                        <div class="space-y-2 text-sm">
                            <p class="text-gray-700 dark:text-gray-300"><strong>วิทยากร:</strong> ${calculateCategoryAverage(record.ratings.instructor).toFixed(2)}/5.00</p>
                            <p class="text-gray-700 dark:text-gray-300"><strong>เนื้อหา:</strong> ${calculateCategoryAverage(record.ratings.content).toFixed(2)}/5.00</p>
                            <p class="text-gray-700 dark:text-gray-300"><strong>สถานที่:</strong> ${calculateCategoryAverage(record.ratings.venue).toFixed(2)}/5.00</p>
                            <p class="text-gray-700 dark:text-gray-300"><strong>อาหาร:</strong> ${calculateCategoryAverage(record.ratings.catering).toFixed(2)}/5.00</p>
                            <p class="text-gray-700 dark:text-gray-300"><strong>ประโยชน์:</strong> ${calculateCategoryAverage(record.ratings.benefit).toFixed(2)}/5.00</p>
                        </div>
                    </div>

                    <!-- Open-ended -->
                    <div class="bg-green-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 class="font-bold text-gray-800 dark:text-white mb-3">💬 ข้อคิดเห็น</h3>
                        <div class="space-y-2 text-sm">
                            <p class="text-gray-700 dark:text-gray-300"><strong>จุดเด่น:</strong> ${record.openEnded.strengths || '-'}</p>
                            <p class="text-gray-700 dark:text-gray-300"><strong>ข้อเสนอแนะ:</strong> ${record.openEnded.suggestions || '-'}</p>
                            <p class="text-gray-700 dark:text-gray-300"><strong>หัวข้อในอนาคต:</strong> ${record.openEnded.futureTopics || '-'}</p>
                        </div>
                    </div>
                </div>

                <div class="mt-6 flex justify-end">
                    <button onclick="closeModal()" class="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors duration-200">
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
    <div class="space-y-6 animate-fadeIn">
        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-4 sm:p-6 card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs sm:text-sm font-semibold opacity-80">จำนวนผลประเมิน</p>
                        <p class="text-2xl sm:text-3xl font-bold mt-2" id="stat-total">0</p>
                    </div>
                    <div class="text-3xl sm:text-4xl">📊</div>
                </div>
            </div>

            <div class="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-xl shadow-lg p-4 sm:p-6 card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs sm:text-sm font-semibold opacity-80">คะแนนเฉลี่ยรวม</p>
                        <p class="text-2xl sm:text-3xl font-bold mt-2" id="stat-avg">0.00</p>
                    </div>
                    <div class="text-3xl sm:text-4xl">⭐</div>
                </div>
            </div>

            <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-4 sm:p-6 card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs sm:text-sm font-semibold opacity-80">คะแนนสูงสุด</p>
                        <p class="text-2xl sm:text-3xl font-bold mt-2" id="stat-max">0.00</p>
                    </div>
                    <div class="text-3xl sm:text-4xl">🏆</div>
                </div>
            </div>

            <div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-4 sm:p-6 card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs sm:text-sm font-semibold opacity-80">คะแนนต่ำสุด</p>
                        <p class="text-2xl sm:text-3xl font-bold mt-2" id="stat-min">0.00</p>
                    </div>
                    <div class="text-3xl sm:text-4xl">📉</div>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6">
                <h3 class="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4">📊 คะแนนเฉลี่ยแต่ละหมวด</h3>
                <canvas id="barChart"></canvas>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6">
                <h3 class="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4">🎯 แผนภูมิเรดาร์</h3>
                <canvas id="radarChart"></canvas>
            </div>
        </div>
    </div>
    `;
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

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-avg').textContent = avg.toFixed(2);
    document.getElementById('stat-max').textContent = max.toFixed(2);
    document.getElementById('stat-min').textContent = min.toFixed(2);

    // Render charts
    renderCharts();
}

function renderCharts() {
    if (feedbackData.length === 0) return;

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? '#4b5563' : '#e5e7eb';

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

    // Bar Chart
    const barCtx = document.getElementById('barChart').getContext('2d');
    if (barChartInstance) barChartInstance.destroy();

    barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'คะแนนเฉลี่ย',
                data: data,
                backgroundColor: [
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(251, 146, 60, 0.8)'
                ],
                borderColor: [
                    'rgba(139, 92, 246, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(251, 146, 60, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: textColor }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });

    // Radar Chart
    const radarCtx = document.getElementById('radarChart').getContext('2d');
    if (radarChartInstance) radarChartInstance.destroy();

    radarChartInstance = new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'คะแนนเฉลี่ย',
                data: data,
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(139, 92, 246, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(139, 92, 246, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: textColor }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        color: textColor,
                        stepSize: 1
                    },
                    grid: { color: gridColor },
                    pointLabels: { color: textColor }
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
            saveData();
            renderRecordsList();
            showToast(`Import สำเร็จ ${newRecords.length} รายการ`, 'success');

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
        success: 'from-green-500 to-green-600',
        error: 'from-red-500 to-red-600',
        warning: 'from-yellow-500 to-yellow-600',
        info: 'from-blue-500 to-blue-600'
    };

    const toast = document.createElement('div');
    toast.className = `toast bg-gradient-to-r ${colors[type]} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg flex items-center gap-3`;
    toast.innerHTML = `
        <span class="text-xl sm:text-2xl">${icons[type]}</span>
        <span class="font-semibold text-sm sm:text-base">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========================================
// CONFIRMATION MODAL
// ========================================
function showConfirmModal(title, message, onConfirm) {
    const modalHTML = `
        <div class="modal-backdrop" onclick="closeModal()">
            <div class="modal-content max-w-md" onclick="event.stopPropagation()">
                <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-4">${title}</h2>
                <p class="text-gray-700 dark:text-gray-300 mb-6">${message}</p>
                <div class="flex justify-end gap-3">
                    <button onclick="closeModal()"
                            class="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors duration-200">
                        ยกเลิก
                    </button>
                    <button onclick="confirmAction()"
                            class="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors duration-200">
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
