/**
 * Clicker Quest - 动画管理器
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 管理所有动画效果的创建和播放
 */

class AnimationManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // 动画队列
        this.animationQueue = [];
        
        // 粒子容器
        this.particleContainer = null;
        
        // 飘字容器
        this.floatingTextContainer = null;
        
        // 暴击等级配置
        this.criticalLevels = {
            small: { multiplier: 2, color: '#FFD700', intensity: 10, particles: 5 },
            medium: { multiplier: 5, color: '#FF9800', intensity: 20, particles: 10 },
            large: { multiplier: 10, color: '#FF5722', intensity: 40, particles: 20 }
        };
        
        // 初始化
        this._init();
    }

    /**
     * 初始化动画管理器
     * @private
     */
    _init() {
        // 获取或创建飘字容器
        this.floatingTextContainer = document.getElementById('floating-text-container');
        if (!this.floatingTextContainer) {
            this.floatingTextContainer = document.createElement('div');
            this.floatingTextContainer.id = 'floating-text-container';
            document.body.appendChild(this.floatingTextContainer);
        }
        
        // 获取或创建粒子容器
        this.particleContainer = document.getElementById('particle-container');
        if (!this.particleContainer) {
            this.particleContainer = document.createElement('div');
            this.particleContainer.id = 'particle-container';
            this.particleContainer.className = 'particle-container';
            document.body.appendChild(this.particleContainer);
        }
        
        // 监听事件
        if (this.eventBus) {
            this.eventBus.on('gold:earned', (data) => {
                this.playGoldFloat(data.amount, data.position, data.type);
            });
            
            this.eventBus.on('critical:hit', (data) => {
                this.playCriticalEffect(data.level, data.position);
            });
        }
    }

    /**
     * 播放金币飘字动画
     * @param {number} amount - 金币数量
     * @param {Object} position - 位置 {x, y}
     * @param {string} type - 类型（normal/critical-small/critical-medium/critical-large）
     */
    playGoldFloat(amount, position, type = 'normal') {
        const text = document.createElement('div');
        text.className = `floating-gold ${type !== 'normal' ? type : ''}`;
        text.textContent = `+${this._formatNumber(amount)}`;
        
        const x = (position && position.x) || (window.innerWidth / 2);
        const y = (position && position.y) || (window.innerHeight / 2);
        text.style.left = `${x}px`;
        text.style.top = `${y}px`;
        text.style.transform = 'translate(-50%, -50%)';
        
        const randomOffset = (Math.random() - 0.5) * 60;
        text.style.marginLeft = `${randomOffset}px`;
        
        this.floatingTextContainer.appendChild(text);
        
        // 动画结束后移除
        const duration = type === 'critical-large' ? 1000 : 800;
        setTimeout(() => {
            if (text.parentNode) {
                text.parentNode.removeChild(text);
            }
        }, duration);
        
        // 触发事件
        if (this.eventBus) {
            this.eventBus.emit('animation:goldFloat', { amount, type });
        }
    }

    /**
     * 播放暴击特效
     * @param {string} level - 暴击等级（small/medium/large）
     * @param {Object} position - 位置 {x, y}
     */
    playCriticalEffect(level, position) {
        const config = this.criticalLevels[level] || this.criticalLevels.small;
        
        // 1. 屏幕震动
        this.playScreenShake(config.intensity, config.intensity * 2);
        
        // 2. 光晕效果
        this._createGlowEffect(position, config.color);
        
        // 3. 粒子效果
        this.playParticles({
            position: position,
            count: config.particles,
            color: config.color,
            type: 'burst'
        });
        
        // 4. 暴击文字
        this._showCriticalText(position, level);
        
        // 触发事件
        if (this.eventBus) {
            this.eventBus.emit('animation:critical', { level, position });
        }
    }

    /**
     * 播放按钮点击动画
     * @param {HTMLElement} element - 元素
     */
    playButtonClick(element) {
        if (!element) return;
        
        // 添加点击动画类
        element.classList.add('btn-clicking');
        
        // 创建波纹效果
        this._createRippleEffect(element);
        
        // 移除动画类
        setTimeout(() => {
            element.classList.remove('btn-clicking');
        }, 150);
    }

    /**
     * 播放数值变化动画
     * @param {HTMLElement} element - 元素
     * @param {number} from - 起始值
     * @param {number} to - 目标值
     * @param {number} duration - 持续时间（毫秒）
     */
    playNumberChange(element, from, to, duration = 300) {
        if (!element) return;
        
        const startTime = performance.now();
        const difference = to - from;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用缓动函数
            const easeProgress = this._easeOutCubic(progress);
            const currentValue = from + difference * easeProgress;
            
            element.textContent = this._formatNumber(Math.floor(currentValue));
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = this._formatNumber(to);
            }
        };
        
        requestAnimationFrame(animate);
        
        // 添加脉冲效果
        element.classList.add('value-updated');
        setTimeout(() => {
            element.classList.remove('value-updated');
        }, 200);
    }

    /**
     * 播放屏幕震动
     * @param {number} intensity - 强度（像素）
     * @param {number} duration - 持续时间（毫秒）
     */
    playScreenShake(intensity = 10, duration = 100) {
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) return;
        
        const startTime = performance.now();
        const originalTransform = gameContainer.style.transform || '';
        
        const shake = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // 衰减震动
                const decay = 1 - progress;
                const currentIntensity = intensity * decay;
                
                const x = (Math.random() - 0.5) * currentIntensity * 2;
                const y = (Math.random() - 0.5) * currentIntensity * 2;
                
                gameContainer.style.transform = `${originalTransform} translate(${x}px, ${y}px)`;
                
                requestAnimationFrame(shake);
            } else {
                gameContainer.style.transform = originalTransform;
            }
        };
        
        requestAnimationFrame(shake);
    }

    /**
     * 播放粒子效果
     * @param {Object} options - 粒子配置
     * @param {Object} options.position - 位置 {x, y}
     * @param {number} options.count - 粒子数量
     * @param {string} options.color - 颜色
     * @param {string} options.type - 类型（burst/fountain/rain）
     */
    playParticles(options) {
        const {
            position = { x: window.innerWidth / 2, y: window.innerHeight / 2 },
            count = 10,
            color = '#FFD700',
            type = 'burst'
        } = options;
        
        for (let i = 0; i < count; i++) {
            this._createParticle(position, color, type, i * 20);
        }
    }

    /**
     * 创建金币飞行动画
     * @param {Object} from - 起始位置 {x, y}
     * @param {Object} to - 目标位置 {x, y}
     * @param {number} count - 金币数量
     * @param {Function} onComplete - 完成回调
     */
    createCoinFlyAnimation(from, to, count = 5, onComplete) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this._createFlyingCoin(from, to, i === count - 1 ? onComplete : null);
            }, i * 50);
        }
    }

    /**
     * 创建单个飞行金币
     * @private
     */
    _createFlyingCoin(from, to, onComplete) {
        const coin = document.createElement('div');
        coin.className = 'flying-coin';
        coin.textContent = '🪙';
        coin.style.left = `${from.x}px`;
        coin.style.top = `${from.y}px`;
        
        this.particleContainer.appendChild(coin);
        
        // 贝塞尔曲线动画
        const duration = 600;
        const startTime = performance.now();
        
        // 控制点（创建弧线）
        const controlX = (from.x + to.x) / 2 + (Math.random() - 0.5) * 100;
        const controlY = Math.min(from.y, to.y) - 100;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 二次贝塞尔曲线
            const t = progress;
            const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * controlX + t * t * to.x;
            const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * controlY + t * t * to.y;
            
            coin.style.left = `${x}px`;
            coin.style.top = `${y}px`;
            coin.style.opacity = 1 - progress * 0.3;
            coin.style.transform = `scale(${1 - progress * 0.3})`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                coin.remove();
                if (onComplete) onComplete();
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * 创建单个粒子
     * @private
     */
    _createParticle(position, color, type, delay) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.backgroundColor = color;
        particle.style.left = `${position.x}px`;
        particle.style.top = `${position.y}px`;
        
        this.particleContainer.appendChild(particle);
        
        // 根据类型设置不同的运动轨迹
        let angle, speed, gravity;
        
        switch (type) {
            case 'burst':
                angle = Math.random() * Math.PI * 2;
                speed = 100 + Math.random() * 150;
                gravity = 200;
                break;
            case 'fountain':
                angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 3;
                speed = 150 + Math.random() * 100;
                gravity = 300;
                break;
            case 'rain':
                angle = Math.PI / 2;
                speed = 50 + Math.random() * 50;
                gravity = 0;
                break;
            default:
                angle = Math.random() * Math.PI * 2;
                speed = 100;
                gravity = 200;
        }
        
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        
        const duration = 800;
        const startTime = performance.now() + delay;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            
            if (elapsed < 0) {
                requestAnimationFrame(animate);
                return;
            }
            
            const progress = elapsed / duration;
            
            if (progress < 1) {
                const x = position.x + velocityX * progress;
                const y = position.y + velocityY * progress + 0.5 * gravity * progress * progress * 100;
                
                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
                particle.style.opacity = 1 - progress;
                particle.style.transform = `scale(${1 - progress * 0.5})`;
                
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * 创建光晕效果
     * @private
     */
    _createGlowEffect(position, color) {
        const glow = document.createElement('div');
        glow.className = 'glow-effect';
        glow.style.left = `${position.x}px`;
        glow.style.top = `${position.y}px`;
        glow.style.backgroundColor = color;
        
        this.particleContainer.appendChild(glow);
        
        setTimeout(() => {
            glow.remove();
        }, 500);
    }

    /**
     * 显示暴击文字
     * @private
     */
    _showCriticalText(position, level) {
        const text = document.createElement('div');
        text.className = `critical-text critical-${level}`;
        
        const labels = {
            small: '暴击!',
            medium: '大暴击!',
            large: '超级暴击!!'
        };
        
        text.textContent = labels[level] || '暴击!';
        text.style.left = `${position.x}px`;
        text.style.top = `${position.y - 60}px`;
        
        this.floatingTextContainer.appendChild(text);
        
        setTimeout(() => {
            text.remove();
        }, 800);
    }

    /**
     * 创建波纹效果
     * @private
     */
    _createRippleEffect(element) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${rect.left + rect.width / 2 - size / 2}px`;
        ripple.style.top = `${rect.top + rect.height / 2 - size / 2}px`;
        
        document.body.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * 缓动函数 - 三次方缓出
     * @private
     */
    _easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * 格式化数字
     * @private
     */
    _formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        } else if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationManager;
} else {
    window.AnimationManager = AnimationManager;
}
