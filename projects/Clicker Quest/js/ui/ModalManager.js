/**
 * Clicker Quest - 弹窗管理器
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 管理所有弹窗的显示、隐藏和交互
 */

class ModalManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // 当前显示的弹窗
        this.currentModal = null;
        
        // 弹窗容器
        this.container = null;
        
        // 弹窗计数器（用于生成唯一ID）
        this.modalCounter = 0;
        
        // 初始化
        this._init();
    }

    /**
     * 初始化弹窗管理器
     * @private
     */
    _init() {
        // 创建弹窗容器
        this.container = document.getElementById('modal-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'modal-container';
            this.container.className = 'modal-container';
            document.body.appendChild(this.container);
        }
        
        // 绑定全局事件
        this._bindGlobalEvents();
        
        console.log('[ModalManager] 初始化完成');
    }

    /**
     * 绑定全局事件
     * @private
     */
    _bindGlobalEvents() {
        // 点击遮罩层关闭弹窗
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.close('cancel');
            }
        });
        
        // ESC键关闭弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.close('cancel');
            }
        });
    }

    /**
     * 显示弹窗
     * @param {Object} options - 弹窗选项
     * @param {string} options.title - 弹窗标题
     * @param {string} options.content - 弹窗内容（HTML）
     * @param {Array} options.buttons - 按钮配置
     * @param {boolean} options.closeOnOverlay - 点击遮罩层是否关闭
     * @param {boolean} options.showCloseButton - 是否显示关闭按钮
     * @param {string} options.className - 自定义样式类名
     * @returns {Promise<string>} 用户操作结果
     */
    show(options) {
        return new Promise((resolve) => {
            // 如果有当前弹窗，先关闭
            if (this.currentModal) {
                this.close('cancel', false);
            }
            
            // 生成唯一ID
            const modalId = `modal-${++this.modalCounter}`;
            
            // 创建弹窗元素
            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = `modal ${options.className || ''}`;
            
            // 弹窗内容
            const content = `
                <div class="modal-content">
                    ${options.title ? `<div class="modal-header">
                        <h3 class="modal-title">${options.title}</h3>
                        ${options.showCloseButton !== false ? '<button class="modal-close" data-action="cancel">&times;</button>' : ''}
                    </div>` : ''}
                    <div class="modal-body">
                        ${options.content || ''}
                    </div>
                    ${options.buttons && options.buttons.length > 0 ? `
                    <div class="modal-footer">
                        ${options.buttons.map(btn => `
                            <button class="btn ${btn.class || 'btn-default'}" data-action="${btn.action}">
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            `;
            
            modal.innerHTML = content;
            
            // 绑定按钮事件
            modal.querySelectorAll('button[data-action]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    this.close(action);
                    resolve(action);
                });
            });
            
            // 添加到容器
            this.container.appendChild(modal);
            
            // 显示容器
            this.container.classList.add('show');
            
            // 显示弹窗动画
            requestAnimationFrame(() => {
                modal.classList.add('show');
            });
            
            // 保存当前弹窗引用
            this.currentModal = {
                id: modalId,
                element: modal,
                resolve: resolve,
                options: options
            };
            
            // 设置closeOnOverlay选项
            if (options.closeOnOverlay === false) {
                this.container.dataset.closeOnOverlay = 'false';
            } else {
                this.container.dataset.closeOnOverlay = 'true';
            }
        });
    }

    /**
     * 关闭弹窗
     * @param {string} action - 关闭动作
     * @param {boolean} resolve - 是否resolve Promise
     */
    close(action = 'cancel', resolve = true) {
        if (!this.currentModal) return;
        
        const modal = this.currentModal.element;
        
        // 移除动画
        modal.classList.remove('show');
        modal.classList.add('hide');
        
        // 等待动画完成后移除
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            
            // 如果没有其他弹窗，隐藏容器
            if (this.container.children.length === 0) {
                this.container.classList.remove('show');
            }
            
            // resolve Promise
            if (resolve && this.currentModal.resolve) {
                this.currentModal.resolve(action);
            }
            
            this.currentModal = null;
        }, 200);
    }

    /**
     * 显示确认弹窗
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @param {Object} options - 额外选项
     * @returns {Promise<boolean>} 用户是否确认
     */
    confirm(title, message, options = {}) {
        return new Promise((resolve) => {
            this.show({
                title: title,
                content: `<p class="modal-message">${message}</p>`,
                buttons: [
                    {
                        text: options.cancelText || '取消',
                        class: 'btn-secondary',
                        action: 'cancel'
                    },
                    {
                        text: options.confirmText || '确认',
                        class: 'btn-primary',
                        action: 'confirm'
                    }
                ],
                showCloseButton: false,
                ...options
            }).then(action => {
                resolve(action === 'confirm');
            });
        });
    }

    /**
     * 显示警告弹窗
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @param {Object} options - 额外选项
     * @returns {Promise<void>}
     */
    alert(title, message, options = {}) {
        return new Promise((resolve) => {
            this.show({
                title: title,
                content: `<p class="modal-message">${message}</p>`,
                buttons: [
                    {
                        text: options.buttonText || '确定',
                        class: 'btn-primary',
                        action: 'ok'
                    }
                ],
                showCloseButton: false,
                ...options
            }).then(() => {
                resolve();
            });
        });
    }

    /**
     * 显示输入弹窗
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @param {Object} options - 额外选项
     * @returns {Promise<string|null>} 用户输入的内容，取消返回null
     */
    prompt(title, message, options = {}) {
        return new Promise((resolve) => {
            const inputId = `prompt-input-${Date.now()}`;
            
            this.show({
                title: title,
                content: `
                    <p class="modal-message">${message}</p>
                    <input type="${options.inputType || 'text'}" 
                           id="${inputId}" 
                           class="modal-input" 
                           placeholder="${options.placeholder || ''}"
                           value="${options.defaultValue || ''}"
                           ${options.maxLength ? `maxlength="${options.maxLength}"` : ''}>
                `,
                buttons: [
                    {
                        text: options.cancelText || '取消',
                        class: 'btn-secondary',
                        action: 'cancel'
                    },
                    {
                        text: options.confirmText || '确认',
                        class: 'btn-primary',
                        action: 'confirm'
                    }
                ],
                showCloseButton: false,
                ...options
            }).then(action => {
                if (action === 'confirm') {
                    const input = document.getElementById(inputId);
                    resolve(input ? input.value : null);
                } else {
                    resolve(null);
                }
            });
        });
    }

    /**
     * 显示加载弹窗
     * @param {string} message - 加载消息
     * @returns {Object} 加载控制器
     */
    loading(message = '加载中...') {
        const modalId = `modal-${++this.modalCounter}`;
        
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal modal-loading';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-body loading-body">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">${message}</p>
                </div>
            </div>
        `;
        
        this.container.appendChild(modal);
        this.container.classList.add('show');
        
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        
        // 返回控制器
        return {
            close: () => {
                modal.classList.remove('show');
                modal.classList.add('hide');
                
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                    
                    if (this.container.children.length === 0) {
                        this.container.classList.remove('show');
                    }
                }, 200);
            },
            updateMessage: (newMessage) => {
                const msgEl = modal.querySelector('.loading-message');
                if (msgEl) {
                    msgEl.textContent = newMessage;
                }
            }
        };
    }

    /**
     * 显示道具详情弹窗
     * @param {Object} item - 道具数据
     * @param {Function} onPurchase - 购买回调
     * @returns {Promise<void>}
     */
    showItemDetail(item, onPurchase) {
        return new Promise((resolve) => {
            const buttons = [];
            
            if (item.canPurchase && onPurchase) {
                buttons.push({
                    text: `购买 (${NumberFormatter.formatGold(item.price)})`,
                    class: 'btn-primary',
                    action: 'purchase'
                });
            }
            
            buttons.push({
                text: '关闭',
                class: 'btn-secondary',
                action: 'close'
            });
            
            this.show({
                title: item.name,
                content: `
                    <div class="item-detail">
                        <div class="item-icon-large">${item.icon}</div>
                        <div class="item-rarity ${item.rarity}">${this._getRarityText(item.rarity)}</div>
                        <p class="item-description">${item.description}</p>
                        ${item.effects ? `
                        <div class="item-effects">
                            <h4>效果</h4>
                            <ul>
                                ${item.effects.map(effect => `<li>${effect}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        ${item.duration ? `<p class="item-duration">持续时间: ${this._formatDuration(item.duration)}</p>` : ''}
                    </div>
                `,
                buttons: buttons,
                className: 'modal-item-detail'
            }).then(action => {
                if (action === 'purchase' && onPurchase) {
                    onPurchase(item);
                }
                resolve();
            });
        });
    }

    /**
     * 获取稀有度文本
     * @private
     * @param {string} rarity - 稀有度
     * @returns {string} 稀有度文本
     */
    _getRarityText(rarity) {
        const rarityMap = {
            'common': '普通',
            'uncommon': '优秀',
            'rare': '稀有',
            'epic': '史诗',
            'legendary': '传说'
        };
        return rarityMap[rarity] || rarity;
    }

    /**
     * 格式化持续时间
     * @private
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间
     */
    _formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds}秒`;
        } else if (seconds < 3600) {
            return `${Math.floor(seconds / 60)}分钟`;
        } else if (seconds < 86400) {
            return `${Math.floor(seconds / 3600)}小时`;
        } else {
            return `${Math.floor(seconds / 86400)}天`;
        }
    }

    /**
     * 销毁弹窗管理器
     */
    destroy() {
        // 关闭所有弹窗
        if (this.currentModal) {
            this.close('cancel', false);
        }
        
        // 清空容器
        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.remove('show');
        }
        
        console.log('[ModalManager] 已销毁');
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalManager;
} else {
    window.ModalManager = ModalManager;
}
