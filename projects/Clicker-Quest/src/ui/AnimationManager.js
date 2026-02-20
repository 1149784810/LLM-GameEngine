/**
 * AnimationManager - 动画管理模块
 * 负责金币飘字、按钮动画、暴击特效
 * 
 * @module AnimationManager
 * @author LP -> UIP-2
 * @version 1.0.0
 */

class AnimationManager {
    constructor() {
        // 动画配置
        this.config = {
            floatingTextDuration: 1000,      // 飘字持续时间
            clickScaleDuration: 100,         // 点击缩放持续时间
            critFlashDuration: 300,          // 暴击闪光持续时间
            maxFloatingTexts: 15,            // 最大同时飘字数量
            particleCount: {                 // 粒子数量配置
                small: 6,
                medium: 12,
                mega: 20
            }
        };
        
        // 对象池
        this.floatingTextPool = [];
        this.particlePool = [];
        this.maxPoolSize = 30;
        
        // 当前活跃的飘字数量
        this.activeFloatingTexts = 0;
        
        // 初始化状态
        this.initialized = false;
        
        // 震动容器引用
        this.shakeContainer = null;
    }

    /**
     * 初始化动画管理器
     */
    init() {
        if (this.initialized) return;
        
        // 预创建对象池
        this.preCreatePool();
        
        // 查找震动容器
        this.shakeContainer = document.querySelector('.click-area') || document.body;
        
        // 添加CSS变量（如果不存在）
        this.ensureCSSVariables();
        
        this.initialized = true;
        console.log('[AnimationManager] 初始化完成');
    }

    /**
     * 预创建对象池
     */
    preCreatePool() {
        // 预创建飘字元素
        for (let i = 0; i < 10; i++) {
            const element = document.createElement('div');
            element.className = 'floating-text';
            this.floatingTextPool.push(element);
        }
        
        // 预创建粒子元素
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            this.particlePool.push(particle);
        }
    }

    /**
     * 确保CSS变量存在
     */
    ensureCSSVariables() {
        const root = document.documentElement;
        const requiredVars = {
            '--color-crit-small': '#FFEB3B',
            '--color-crit-medium': '#FF9800',
            '--color-crit-mega': '#FFD700',
            '--color-primary': '#FFD700',
            '--color-success': '#4CAF50',
            '--color-error': '#F44336'
        };
        
        Object.entries(requiredVars).forEach(([name, value]) => {
            if (!getComputedStyle(root).getPropertyValue(name)) {
                root.style.setProperty(name, value);
            }
        });
    }

    /**
     * 创建金币飘字动画
     * @param {number} amount - 金币数量
     * @param {HTMLElement} container - 容器元素
     * @param {Object} options - 选项
     * @param {number} options.x - X坐标
     * @param {number} options.y - Y坐标
     * @param {string} options.criticalType - 暴击类型 (SMALL, MEDIUM, MEGA)
     */
    createFloatingText(amount, container, options = {}) {
        // 检查最大飘字数量限制
        if (this.activeFloatingTexts >= this.config.maxFloatingTexts) {
            return;
        }
        
        const text = this.getFloatingTextElement();
        text.textContent = `+${this.formatNumber(amount)}`;
        text.className = 'floating-text';
        
        // 重置样式
        text.style.cssText = '';
        
        // 计算位置（添加随机偏移）
        const baseX = options.x || 0;
        const baseY = options.y || 0;
        const randomOffsetX = (Math.random() - 0.5) * 60; // ±30px随机偏移
        const randomOffsetY = (Math.random() - 0.5) * 20; // ±10px随机偏移
        
        text.style.left = `${baseX + randomOffsetX}px`;
        text.style.top = `${baseY + randomOffsetY}px`;
        text.style.transform = 'translate(-50%, -50%)';
        
        // 添加暴击样式
        if (options.criticalType === 'MEGA') {
            text.classList.add('mega-crit');
            text.style.fontSize = '36px';
            text.style.color = 'var(--color-crit-mega)';
            text.style.textShadow = '0 0 20px rgba(255, 215, 0, 0.8), 0 2px 4px rgba(0,0,0,0.5)';
        } else if (options.criticalType === 'MEDIUM') {
            text.classList.add('medium-crit');
            text.style.fontSize = '28px';
            text.style.color = 'var(--color-crit-medium)';
            text.style.textShadow = '0 0 15px rgba(255, 152, 0, 0.6), 0 2px 4px rgba(0,0,0,0.5)';
        } else if (options.criticalType === 'SMALL') {
            text.classList.add('small-crit');
            text.style.fontSize = '24px';
            text.style.color = 'var(--color-crit-small)';
            text.style.textShadow = '0 0 10px rgba(255, 235, 59, 0.5), 0 2px 4px rgba(0,0,0,0.5)';
        } else {
            text.style.fontSize = '20px';
            text.style.color = 'var(--color-primary)';
            text.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.5), 0 2px 4px rgba(0,0,0,0.5)';
        }
        
        container.appendChild(text);
        this.activeFloatingTexts++;
        
        // 使用requestAnimationFrame确保动画触发
        requestAnimationFrame(() => {
            text.classList.add('animate');
        });
        
        // 动画结束后回收
        const duration = options.criticalType === 'MEGA' ? 1200 : this.config.floatingTextDuration;
        setTimeout(() => {
            this.recycleFloatingText(text);
            this.activeFloatingTexts--;
        }, duration);
    }

    /**
     * 获取飘字元素（对象池）
     * @returns {HTMLElement} 飘字元素
     */
    getFloatingTextElement() {
        if (this.floatingTextPool.length > 0) {
            const element = this.floatingTextPool.pop();
            element.className = 'floating-text';
            element.style.cssText = '';
            return element;
        }
        return document.createElement('div');
    }

    /**
     * 回收飘字元素
     * @param {HTMLElement} element - 飘字元素
     */
    recycleFloatingText(element) {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
        element.className = 'floating-text';
        element.style.cssText = '';
        
        if (this.floatingTextPool.length < this.maxPoolSize) {
            this.floatingTextPool.push(element);
        }
    }

    /**
     * 播放点击按钮动画
     * @param {HTMLElement} button - 按钮元素
     */
    playClickAnimation(button) {
        if (!button) return;
        
        // 添加点击动画类
        button.classList.add('click-animating');
        button.style.transform = 'scale(0.95)';
        
        // 使用requestAnimationFrame确保流畅
        requestAnimationFrame(() => {
            setTimeout(() => {
                button.style.transform = '';
                button.classList.remove('click-animating');
            }, this.config.clickScaleDuration);
        });
    }

    /**
     * 播放暴击特效
     * @param {string} type - 暴击类型 (SMALL, MEDIUM, MEGA)
     * @param {HTMLElement} container - 容器元素
     */
    playCriticalEffect(type, container) {
        if (!container) return;
        
        switch (type) {
            case 'MEGA':
                this.playMegaCritEffect(container);
                break;
            case 'MEDIUM':
                this.playMediumCritEffect(container);
                break;
            case 'SMALL':
                this.playSmallCritEffect(container);
                break;
            default:
                break;
        }
    }

    /**
     * 播放大暴击特效
     * @param {HTMLElement} container - 容器元素
     */
    playMegaCritEffect(container) {
        // 金色闪光
        container.classList.add('mega-crit-flash');
        
        // 创建粒子爆发效果
        this.createParticleBurst(container, 'mega');
        
        // 强烈震动效果
        this.playShakeEffect('mega');
        
        setTimeout(() => {
            container.classList.remove('mega-crit-flash');
        }, this.config.critFlashDuration);
    }

    /**
     * 播放中暴击特效
     * @param {HTMLElement} container - 容器元素
     */
    playMediumCritEffect(container) {
        // 橙色闪光
        container.classList.add('medium-crit-flash');
        
        // 创建粒子效果
        this.createParticleBurst(container, 'medium');
        
        // 轻微震动效果
        this.playShakeEffect('medium');
        
        setTimeout(() => {
            container.classList.remove('medium-crit-flash');
        }, this.config.critFlashDuration);
    }

    /**
     * 播放小暴击特效
     * @param {HTMLElement} container - 容器元素
     */
    playSmallCritEffect(container) {
        // 黄色闪光
        container.classList.add('small-crit-flash');
        
        // 创建小粒子效果
        this.createParticleBurst(container, 'small');
        
        setTimeout(() => {
            container.classList.remove('small-crit-flash');
        }, this.config.critFlashDuration);
    }

    /**
     * 创建粒子爆发效果
     * @param {HTMLElement} container - 容器元素
     * @param {string} type - 类型 (small, medium, mega)
     */
    createParticleBurst(container, type) {
        const count = this.config.particleCount[type] || 6;
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // 颜色配置
        const colors = {
            small: ['#FFEB3B', '#FFF176', '#FFEE58'],
            medium: ['#FF9800', '#FFB74D', '#FFA726'],
            mega: ['#FFD700', '#FFC107', '#FFEB3B', '#FFF8E1']
        };
        
        const particleColors = colors[type] || colors.small;
        
        for (let i = 0; i < count; i++) {
            const particle = this.getParticleElement();
            
            // 随机颜色
            const color = particleColors[Math.floor(Math.random() * particleColors.length)];
            particle.style.backgroundColor = color;
            particle.style.boxShadow = `0 0 6px ${color}`;
            
            // 随机大小
            const size = type === 'mega' ? 4 + Math.random() * 6 : 3 + Math.random() * 4;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // 随机方向和距离
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const distance = 50 + Math.random() * 80;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            // 设置初始位置
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            particle.style.transform = 'translate(-50%, -50%)';
            
            container.appendChild(particle);
            
            // 使用CSS动画
            requestAnimationFrame(() => {
                particle.style.setProperty('--end-x', `${endX}px`);
                particle.style.setProperty('--end-y', `${endY}px`);
                particle.classList.add('particle-burst');
            });
            
            // 回收粒子
            setTimeout(() => {
                this.recycleParticle(particle);
            }, 500);
        }
    }

    /**
     * 获取粒子元素
     * @returns {HTMLElement} 粒子元素
     */
    getParticleElement() {
        if (this.particlePool.length > 0) {
            const particle = this.particlePool.pop();
            particle.className = 'particle';
            particle.style.cssText = '';
            return particle;
        }
        return document.createElement('div');
    }

    /**
     * 回收粒子元素
     * @param {HTMLElement} particle - 粒子元素
     */
    recycleParticle(particle) {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
        particle.className = 'particle';
        particle.style.cssText = '';
        
        if (this.particlePool.length < this.maxPoolSize) {
            this.particlePool.push(particle);
        }
    }

    /**
     * 播放震动效果
     * @param {string} intensity - 强度 (small, medium, mega)
     */
    playShakeEffect(intensity) {
        if (!this.shakeContainer) return;
        
        const shakeClass = `shake-${intensity}`;
        this.shakeContainer.classList.add(shakeClass);
        
        setTimeout(() => {
            this.shakeContainer.classList.remove(shakeClass);
        }, 200);
    }

    /**
     * 播放购买成功动画
     * @param {HTMLElement} element - 元素
     */
    playPurchaseAnimation(element) {
        if (!element) return;
        
        // 卡片边框闪烁
        element.classList.add('purchase-success');
        
        // 金币数字减少动画由外部处理
        // 等级跳动动画
        const levelElement = element.querySelector('.item-level');
        if (levelElement) {
            levelElement.classList.add('level-bump');
            setTimeout(() => {
                levelElement.classList.remove('level-bump');
            }, 300);
        }
        
        setTimeout(() => {
            element.classList.remove('purchase-success');
        }, 300);
    }

    /**
     * 播放成就解锁动画
     * @param {HTMLElement} element - 元素
     */
    playAchievementUnlockAnimation(element) {
        if (!element) return;
        
        // 成就图标发光
        element.classList.add('achievement-unlock');
        
        // 成就弹窗动画由外部处理
    }

    /**
     * 播放BUFF入场动画
     * @param {HTMLElement} element - BUFF元素
     */
    playBuffEntryAnimation(element) {
        if (!element) return;
        
        element.classList.add('buff-entry');
        setTimeout(() => {
            element.classList.remove('buff-entry');
        }, 500);
    }

    /**
     * 播放BUFF即将结束警告
     * @param {HTMLElement} element - BUFF元素
     * @param {boolean} warning - 是否显示警告
     */
    setBuffWarning(element, warning) {
        if (!element) return;
        
        if (warning) {
            element.classList.add('buff-warning');
        } else {
            element.classList.remove('buff-warning');
        }
    }

    /**
     * 播放BUFF过期消失动画
     * @param {HTMLElement} element - BUFF元素
     * @param {Function} callback - 动画结束回调
     */
    playBuffExpireAnimation(element, callback) {
        if (!element) return;
        
        element.classList.add('buff-expire');
        
        setTimeout(() => {
            if (callback) callback();
        }, 300);
    }

    /**
     * 播放金币数字变化动画
     * @param {HTMLElement} element - 金币数字元素
     */
    playGoldBumpAnimation(element) {
        if (!element) return;
        
        element.classList.add('gold-bump');
        setTimeout(() => {
            element.classList.remove('gold-bump');
        }, 100);
    }

    /**
     * 格式化数字
     * @param {number} num - 数字
     * @returns {string} 格式化后的字符串
     */
    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return Math.floor(num).toString();
    }

    /**
     * 清理所有动画资源
     */
    cleanup() {
        // 清理对象池
        this.floatingTextPool = [];
        this.particlePool = [];
        this.activeFloatingTexts = 0;
    }
}

// 创建全局实例
window.animationManager = new AnimationManager();

// 导出类
window.AnimationManager = AnimationManager;
