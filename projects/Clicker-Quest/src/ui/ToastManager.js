/**
 * ToastManager - Toast通知管理模块
 * 负责显示临时提示消息
 * 
 * @module ToastManager
 * @author LP -> UIP-2
 * @version 1.0.0
 */

class ToastManager {
    constructor() {
        // Toast配置
        this.config = {
            duration: 3000,          // 默认持续时间
            maxToasts: 5,            // 最大显示数量
            position: 'top',         // 位置 (top, bottom)
            animationDuration: 300   // 动画持续时间
        };
        
        // Toast队列
        this.toastQueue = [];
        this.activeToasts = [];
        this.container = null;
        
        // 初始化状态
        this.initialized = false;
        
        // Toast类型配置
        this.typeConfig = {
            success: {
                icon: '✓',
                bgColor: '#4CAF50',
                textColor: '#FFFFFF'
            },
            error: {
                icon: '✕',
                bgColor: '#F44336',
                textColor: '#FFFFFF'
            },
            warning: {
                icon: '⚠',
                bgColor: '#FF9800',
                textColor: '#1A1A2E'
            },
            info: {
                icon: 'ℹ',
                bgColor: '#2196F3',
                textColor: '#FFFFFF'
            }
        };
    }

    /**
     * 初始化Toast管理器
     */
    init() {
        if (this.initialized) return;
        
        // 创建或获取容器
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = this.createContainer();
        }
        
        this.initialized = true;
        console.log('[ToastManager] 初始化完成');
    }

    /**
     * 创建Toast容器
     * @returns {HTMLElement} 容器元素
     */
    createContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
        return container;
    }

    /**
     * 显示Toast消息
     * @param {string} message - 消息内容
     * @param {string} type - 类型 (success, error, warning, info)
     * @param {Object} options - 选项
     * @param {number} options.duration - 持续时间
     * @param {boolean} options.closable - 是否可关闭
     * @param {Function} options.onClose - 关闭回调
     */
    show(message, type = 'info', options = {}) {
        // 确保已初始化
        if (!this.initialized) {
            this.init();
        }
        
        const duration = options.duration || this.config.duration;
        const closable = options.closable !== false;
        
        // 如果达到最大数量，移除最早的Toast
        if (this.activeToasts.length >= this.config.maxToasts) {
            const oldestToast = this.activeToasts.shift();
            if (oldestToast) {
                this.hide(oldestToast.element);
            }
        }
        
        // 创建Toast元素
        const toast = this.createToastElement(message, type, closable);
        
        // 存储Toast信息
        const toastInfo = {
            element: toast,
            timer: null,
            onClose: options.onClose
        };
        
        // 添加到容器
        this.container.appendChild(toast);
        this.activeToasts.push(toastInfo);
        
        // 触发入场动画
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // 设置自动关闭定时器
        if (duration > 0) {
            toastInfo.timer = setTimeout(() => {
                this.hide(toast);
            }, duration);
        }
        
        // 返回关闭方法
        return {
            close: () => this.hide(toast)
        };
    }

    /**
     * 创建Toast元素
     * @param {string} message - 消息内容
     * @param {string} type - 类型
     * @param {boolean} closable - 是否可关闭
     * @returns {HTMLElement} Toast元素
     */
    createToastElement(message, type, closable = true) {
        const typeConf = this.typeConfig[type] || this.typeConfig.info;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.style.setProperty('--toast-bg', typeConf.bgColor);
        toast.style.setProperty('--toast-text', typeConf.textColor);
        
        // 创建图标
        const icon = document.createElement('span');
        icon.className = 'toast-icon';
        icon.textContent = typeConf.icon;
        
        // 创建消息
        const messageEl = document.createElement('span');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;
        
        toast.appendChild(icon);
        toast.appendChild(messageEl);
        
        // 创建关闭按钮
        if (closable) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'toast-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.setAttribute('aria-label', '关闭');
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.hide(toast);
            };
            toast.appendChild(closeBtn);
        }
        
        return toast;
    }

    /**
     * 隐藏Toast
     * @param {HTMLElement} toast - Toast元素
     */
    hide(toast) {
        if (!toast || !toast.parentNode) return;
        
        // 查找Toast信息
        const toastIndex = this.activeToasts.findIndex(t => t.element === toast);
        if (toastIndex !== -1) {
            const toastInfo = this.activeToasts[toastIndex];
            
            // 清除定时器
            if (toastInfo.timer) {
                clearTimeout(toastInfo.timer);
            }
            
            // 执行回调
            if (toastInfo.onClose) {
                toastInfo.onClose();
            }
            
            // 从列表中移除
            this.activeToasts.splice(toastIndex, 1);
        }
        
        // 播放退出动画
        toast.classList.remove('show');
        toast.classList.add('hide');
        
        // 动画结束后移除元素
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, this.config.animationDuration);
    }

    /**
     * 显示成功消息
     * @param {string} message - 消息内容
     * @param {Object} options - 选项
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    /**
     * 显示错误消息
     * @param {string} message - 消息内容
     * @param {Object} options - 选项
     */
    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    /**
     * 显示警告消息
     * @param {string} message - 消息内容
     * @param {Object} options - 选项
     */
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    /**
     * 显示信息消息
     * @param {string} message - 消息内容
     * @param {Object} options - 选项
     */
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    /**
     * 显示购买成功Toast
     * @param {string} itemName - 商品名称
     */
    purchaseSuccess(itemName) {
        return this.success(`购买成功: ${itemName}`, { duration: 2000 });
    }

    /**
     * 显示金币不足Toast
     */
    notEnoughGold() {
        return this.error('金币不足!', { duration: 2000 });
    }

    /**
     * 显示成就解锁Toast
     * @param {string} achievementName - 成就名称
     */
    achievementUnlocked(achievementName) {
        return this.success(`成就解锁: ${achievementName}`, { duration: 4000 });
    }

    /**
     * 显示BUFF激活Toast
     * @param {string} buffName - BUFF名称
     * @param {number} duration - 持续时间(秒)
     */
    buffActivated(buffName, duration) {
        return this.info(`${buffName} 已激活 (${duration}秒)`, { duration: 2000 });
    }

    /**
     * 显示道具使用Toast
     * @param {string} itemName - 道具名称
     */
    itemUsed(itemName) {
        return this.success(`使用了 ${itemName}`, { duration: 2000 });
    }

    /**
     * 清除所有Toast
     */
    clearAll() {
        // 清除所有定时器
        this.activeToasts.forEach(toastInfo => {
            if (toastInfo.timer) {
                clearTimeout(toastInfo.timer);
            }
        });
        
        // 清空容器
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        this.activeToasts = [];
    }

    /**
     * 设置配置
     * @param {Object} config - 配置对象
     */
    setConfig(config) {
        Object.assign(this.config, config);
    }

    /**
     * 获取当前活跃Toast数量
     * @returns {number} Toast数量
     */
    getActiveCount() {
        return this.activeToasts.length;
    }
}

// 创建全局实例
window.toastManager = new ToastManager();

// 提供便捷的全局方法
window.toast = {
    show: (message, type, options) => window.toastManager.show(message, type, options),
    success: (message, options) => window.toastManager.success(message, options),
    error: (message, options) => window.toastManager.error(message, options),
    warning: (message, options) => window.toastManager.warning(message, options),
    info: (message, options) => window.toastManager.info(message, options)
};

// 导出类
window.ToastManager = ToastManager;
