/**
 * Clicker Quest - 成就界面UI
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 渲染成就界面、处理成就交互
 */

class AchievementScreenUI {
    constructor(eventBus, uiManager, achievementManager, gameData) {
        this.eventBus = eventBus;
        this.uiManager = uiManager;
        this.achievementManager = achievementManager;
        this.gameData = gameData;
        
        // DOM引用
        this.container = null;
        this.achievementList = null;
        this.categoryTabs = null;
        this.statsContainer = null;
        
        // 当前选中的类别
        this.currentCategory = 'all';
        
        // 数字格式化器
        this.numberFormatter = new NumberFormatter();
        
        // 成就类别定义
        this.categories = {
            all: { name: '全部', icon: '📋' },
            gold: { name: '金币', icon: '💰' },
            click: { name: '点击', icon: '👆' },
            critical: { name: '暴击', icon: '💥' },
            dps: { name: 'DPS', icon: '📈' },
            item: { name: '道具', icon: '🎁' },
            special: { name: '特殊', icon: '⭐' }
        };
        
        // 初始化
        this._init();
    }

    /**
     * 初始化成就界面
     * @private
     */
    _init() {
        // 获取DOM引用
        this.container = document.getElementById('achievement-screen');
        
        if (!this.container) {
            console.warn('[AchievementScreenUI] 成就界面容器不存在');
            return;
        }
        
        // 创建界面结构
        this._createLayout();
        
        // 绑定事件
        this._bindEvents();
        
        // 初始渲染
        this.render();
        
        console.log('[AchievementScreenUI] 初始化完成');
    }

    /**
     * 创建界面布局
     * @private
     */
    _createLayout() {
        this.container.innerHTML = `
            <div class="achievement-header">
                <h2>成就</h2>
                <div class="achievement-stats">
                    <div class="stat-item">
                        <span class="stat-label">已解锁</span>
                        <span class="stat-value" id="achievement-unlocked">0/0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">成就点数</span>
                        <span class="stat-value" id="achievement-points">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">完成度</span>
                        <span class="stat-value" id="achievement-percentage">0%</span>
                    </div>
                </div>
            </div>
            
            <div class="achievement-category-tabs">
                ${Object.entries(this.categories).map(([key, cat]) => `
                    <button class="category-tab ${key === 'all' ? 'active' : ''}" data-category="${key}">
                        <span class="category-icon">${cat.icon}</span>
                        <span class="category-name">${cat.name}</span>
                    </button>
                `).join('')}
            </div>
            
            <div class="achievement-list" id="achievement-list">
                <!-- 成就列表将通过JS动态生成 -->
            </div>
        `;
        
        // 获取DOM引用
        this.achievementList = document.getElementById('achievement-list');
        this.categoryTabs = this.container.querySelectorAll('.category-tab');
        this.statsContainer = {
            unlocked: document.getElementById('achievement-unlocked'),
            points: document.getElementById('achievement-points'),
            percentage: document.getElementById('achievement-percentage')
        };
    }

    /**
     * 绑定事件
     * @private
     */
    _bindEvents() {
        // 类别切换
        this.categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.dataset.category;
                this.switchCategory(category);
            });
        });
        
        // 监听成就解锁事件
        this.eventBus.on(GameEvents.ACHIEVEMENT_UNLOCKED, (data) => {
            this.render();
        });
    }

    /**
     * 切换类别
     * @param {string} category - 类别名称
     */
    switchCategory(category) {
        if (this.currentCategory === category) return;
        
        this.currentCategory = category;
        
        // 更新标签状态
        this.categoryTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });
        
        // 重新渲染列表
        this.renderAchievementList();
    }

    /**
     * 渲染界面
     */
    render() {
        this.renderStats();
        this.renderAchievementList();
    }

    /**
     * 渲染统计信息
     */
    renderStats() {
        if (!this.achievementManager) return;
        
        const stats = this.achievementManager.getStats();
        
        if (this.statsContainer.unlocked) {
            this.statsContainer.unlocked.textContent = `${stats.unlocked}/${stats.total}`;
        }
        
        if (this.statsContainer.points) {
            this.statsContainer.points.textContent = this.numberFormatter.format(stats.totalPoints);
        }
        
        if (this.statsContainer.percentage) {
            this.statsContainer.percentage.textContent = `${stats.percentage.toFixed(1)}%`;
        }
    }

    /**
     * 渲染成就列表
     */
    renderAchievementList() {
        if (!this.achievementList || !this.achievementManager) return;
        
        // 获取成就列表
        const category = this.currentCategory === 'all' ? null : this.currentCategory;
        const achievements = this.achievementManager.getAllAchievements(category);
        
        // 排序：已解锁的在前，未解锁的在后
        achievements.sort((a, b) => {
            if (a.isUnlocked && !b.isUnlocked) return -1;
            if (!a.isUnlocked && b.isUnlocked) return 1;
            return b.achievement.points - a.achievement.points;
        });
        
        // 生成列表HTML
        if (achievements.length === 0) {
            this.achievementList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏆</div>
                    <p>暂无成就</p>
                </div>
            `;
            return;
        }
        
        this.achievementList.innerHTML = achievements.map(progress => 
            this._createAchievementCard(progress)
        ).join('');
        
        // 绑定卡片点击事件
        this.achievementList.querySelectorAll('.achievement-card').forEach(card => {
            card.addEventListener('click', () => {
                const achievementId = card.dataset.achievementId;
                this._showAchievementDetail(achievementId);
            });
        });
    }

    /**
     * 创建成就卡片HTML
     * @private
     * @param {Object} progress - 成就进度
     * @returns {string} HTML字符串
     */
    _createAchievementCard(progress) {
        const { achievement, current, target, percentage, isUnlocked } = progress;
        
        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}" 
                 data-achievement-id="${achievement.id}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(100, percentage)}%"></div>
                        </div>
                        <div class="progress-text">
                            ${this._formatProgress(achievement.type, current, target)}
                        </div>
                    </div>
                </div>
                <div class="achievement-meta">
                    <div class="achievement-points">
                        <span class="points-icon">⭐</span>
                        <span class="points-value">${achievement.points}</span>
                    </div>
                    ${isUnlocked ? '<div class="unlocked-badge">✓</div>' : ''}
                </div>
            </div>
        `;
    }

    /**
     * 格式化进度文本
     * @private
     * @param {string} type - 成就类型
     * @param {number} current - 当前值
     * @param {number} target - 目标值
     * @returns {string} 格式化后的进度文本
     */
    _formatProgress(type, current, target) {
        const currentFormatted = this._formatValue(current, type);
        const targetFormatted = this._formatValue(target, type);
        
        return `${currentFormatted} / ${targetFormatted}`;
    }

    /**
     * 格式化数值
     * @private
     * @param {number} value - 数值
     * @param {string} type - 类型
     * @returns {string} 格式化后的数值
     */
    _formatValue(value, type) {
        // 对于时间类型的成就（毫秒），转换为可读格式
        if (type === 'cumulative' && value > 100000) {
            // 可能是时间（毫秒）
            const seconds = Math.floor(value / 1000);
            if (seconds >= 3600) {
                const hours = Math.floor(seconds / 3600);
                return `${hours}小时`;
            }
        }
        
        return this.numberFormatter.format(value);
    }

    /**
     * 显示成就详情
     * @private
     * @param {string} achievementId - 成就ID
     */
    _showAchievementDetail(achievementId) {
        const progress = this.achievementManager.getProgress(achievementId);
        if (!progress) return;
        
        const { achievement, current, target, percentage, isUnlocked } = progress;
        
        const content = `
            <div class="achievement-detail">
                <div class="detail-icon">${achievement.icon}</div>
                <div class="detail-name">${achievement.name}</div>
                <div class="detail-category">${this.categories[achievement.category]?.name || achievement.category}</div>
                <p class="detail-description">${achievement.description}</p>
                
                <div class="detail-progress">
                    <div class="progress-label">进度</div>
                    <div class="progress-bar-large">
                        <div class="progress-fill" style="width: ${Math.min(100, percentage)}%"></div>
                    </div>
                    <div class="progress-text">
                        ${this._formatProgress(achievement.type, current, target)} (${percentage.toFixed(1)}%)
                    </div>
                </div>
                
                <div class="detail-reward">
                    <div class="reward-label">奖励</div>
                    <div class="reward-content">
                        ${achievement.reward?.gold ? `
                            <div class="reward-item">
                                <span class="reward-icon">💰</span>
                                <span class="reward-value">${this.numberFormatter.formatGold(achievement.reward.gold)}</span>
                            </div>
                        ` : ''}
                        <div class="reward-item">
                            <span class="reward-icon">⭐</span>
                            <span class="reward-value">${achievement.points} 成就点数</span>
                        </div>
                    </div>
                </div>
                
                ${isUnlocked ? `
                    <div class="detail-status unlocked">
                        <span class="status-icon">✓</span>
                        <span class="status-text">已解锁</span>
                    </div>
                ` : `
                    <div class="detail-status locked">
                        <span class="status-icon">🔒</span>
                        <span class="status-text">未解锁</span>
                    </div>
                `}
            </div>
        `;
        
        this.uiManager.modalManager.show({
            title: '成就详情',
            content: content,
            buttons: [
                {
                    text: '关闭',
                    class: 'btn-secondary',
                    action: 'close'
                }
            ],
            className: 'modal-achievement-detail'
        });
    }

    /**
     * 显示
     */
    show() {
        if (this.container) {
            this.container.classList.add('active');
        }
        this.render();
    }

    /**
     * 隐藏
     */
    hide() {
        if (this.container) {
            this.container.classList.remove('active');
        }
    }

    /**
     * 销毁
     */
    destroy() {
        this.eventBus.clear(GameEvents.ACHIEVEMENT_UNLOCKED);
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        console.log('[AchievementScreenUI] 已销毁');
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementScreenUI;
} else {
    window.AchievementScreenUI = AchievementScreenUI;
}
