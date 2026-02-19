/**
 * Clicker Quest - 商店界面UI
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 管理商店界面的UI渲染和交互
 */

class ShopScreenUI {
    constructor(eventBus, uiManager, shopManager, gameData) {
        this.eventBus = eventBus;
        this.uiManager = uiManager;
        this.shopManager = shopManager;
        this.gameData = gameData;
        
        // DOM引用
        this.container = null;
        this.categoryTabs = null;
        this.itemsContainer = null;
        this.refreshBtn = null;
        this.goldDisplay = null;
        
        // 当前状态
        this.currentCategory = '全部';
        this.currentPage = 1;
        this.pageSize = 20;
        this.isLoading = false;
        
        // 商品缓存
        this.itemsCache = [];
        this.filteredItems = [];
        
        // 虚拟列表相关
        this.virtualList = {
            enabled: false,
            itemHeight: 130, // 卡片高度 + 间距
            bufferSize: 3,
            scrollTop: 0,
            visibleItems: []
        };
        
        // 事件监听器引用
        this._boundHandlers = {};
        
        // 初始化
        this._init();
    }

    /**
     * 初始化商店界面UI
     * @private
     */
    _init() {
        // 创建商店界面HTML结构
        this._createShopStructure();
        
        // 绑定分类切换事件
        this._bindCategoryEvents();
        
        // 绑定事件监听
        this._bindEventListeners();
        
        // 初始化虚拟列表
        this._initVirtualList();
    }

    /**
     * 创建商店界面HTML结构
     * @private
     */
    _createShopStructure() {
        const shopScreen = document.getElementById('shop-screen');
        if (!shopScreen) {
            console.error('Shop screen container not found');
            return;
        }
        
        // 清空现有内容
        shopScreen.innerHTML = '';
        
        // 创建商店界面结构
        const structure = `
            <!-- 顶部栏 -->
            <header class="shop-header">
                <button class="shop-back-btn" id="shop-back-btn">
                    <span class="icon">←</span>
                </button>
                <h2 class="shop-title">商店</h2>
                <div class="shop-gold">
                    <span class="gold-icon">💰</span>
                    <span id="shop-gold-value" class="gold-value">0</span>
                </div>
            </header>
            
            <!-- 分类标签栏 -->
            <nav class="shop-category-tabs" id="shop-category-tabs">
                <button class="category-tab active" data-category="全部">全部</button>
                <button class="category-tab" data-category="自动">自动</button>
                <button class="category-tab" data-category="增益">增益</button>
                <button class="category-tab" data-category="消耗品">消耗品</button>
                <button class="category-tab" data-category="永久">永久</button>
            </nav>
            
            <!-- 商品列表区域 -->
            <div class="shop-items-wrapper">
                <div class="shop-items-container" id="shop-items-container">
                    <!-- 商品卡片将动态生成 -->
                </div>
                <div class="shop-empty-state hidden" id="shop-empty-state">
                    <span class="empty-icon">📦</span>
                    <p class="empty-text">暂无商品</p>
                </div>
                <div class="shop-loading hidden" id="shop-loading">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">加载中...</p>
                </div>
            </div>
            
            <!-- 底部刷新栏 -->
            <footer class="shop-footer">
                <button class="shop-refresh-btn" id="shop-refresh-btn">
                    <span class="refresh-icon">🔄</span>
                    <span class="refresh-text">刷新商品</span>
                    <span class="refresh-count" id="refresh-count">(免费: 3/3)</span>
                </button>
            </footer>
        `;
        
        shopScreen.innerHTML = structure;
        
        // 获取DOM引用
        this.container = shopScreen;
        this.categoryTabs = document.getElementById('shop-category-tabs');
        this.itemsContainer = document.getElementById('shop-items-container');
        this.refreshBtn = document.getElementById('shop-refresh-btn');
        this.goldDisplay = document.getElementById('shop-gold-value');
    }

    /**
     * 绑定分类切换事件
     * @private
     */
    _bindCategoryEvents() {
        if (!this.categoryTabs) return;
        
        const tabs = this.categoryTabs.querySelectorAll('.category-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.switchCategory(category);
            });
        });
    }

    /**
     * 绑定事件监听
     * @private
     */
    _bindEventListeners() {
        // 返回按钮
        const backBtn = document.getElementById('shop-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.eventBus.emit(GameEvents.SHOP_CLOSED);
                this.uiManager.switchScreen('main');
            });
        }
        
        // 刷新按钮
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => {
                this._handleRefresh();
            });
        }
        
        // 监听金币变化
        this._boundHandlers.onGoldChanged = (data) => {
            this._updateGoldDisplay(data.gold);
        };
        this.eventBus.on(GameEvents.GOLD_CHANGED, this._boundHandlers.onGoldChanged);
        
        // 监听商店刷新事件
        this._boundHandlers.onShopRefreshed = (data) => {
            this._onShopRefreshed(data);
        };
        this.eventBus.on(GameEvents.SHOP_REFRESHED, this._boundHandlers.onShopRefreshed);
        
        // 监听商品购买事件
        this._boundHandlers.onItemPurchased = (data) => {
            this._onItemPurchased(data);
        };
        this.eventBus.on(GameEvents.ITEM_PURCHASED, this._boundHandlers.onItemPurchased);
    }

    /**
     * 初始化虚拟列表
     * @private
     */
    _initVirtualList() {
        if (!this.itemsContainer) return;
        
        // 滚动事件处理
        this._boundHandlers.onScroll = this._onScroll.bind(this);
        this.itemsContainer.addEventListener('scroll', this._boundHandlers.onScroll);
    }

    /**
     * 滚动事件处理
     * @param {Event} e
     * @private
     */
    _onScroll(e) {
        if (!this.virtualList.enabled) return;
        
        const scrollTop = e.target.scrollTop;
        this.virtualList.scrollTop = scrollTop;
        
        // 更新可见商品
        this._updateVisibleItems();
    }

    /**
     * 更新可见商品（虚拟列表）
     * @private
     */
    _updateVisibleItems() {
        if (!this.virtualList.enabled) return;
        
        const containerHeight = this.itemsContainer.clientHeight;
        const startIndex = Math.max(0, Math.floor(this.virtualList.scrollTop / this.virtualList.itemHeight) - this.virtualList.bufferSize);
        const endIndex = Math.min(
            this.filteredItems.length,
            Math.ceil((this.virtualList.scrollTop + containerHeight) / this.virtualList.itemHeight) + this.virtualList.bufferSize
        );
        
        // 检查是否需要更新
        const newVisibleRange = { start: startIndex, end: endIndex };
        if (this._visibleRangeEquals(newVisibleRange)) return;
        
        this.virtualList.visibleRange = newVisibleRange;
        
        // 更新DOM
        this._renderVirtualItems(startIndex, endIndex);
    }

    /**
     * 检查可见范围是否相同
     * @param {Object} range
     * @returns {boolean}
     * @private
     */
    _visibleRangeEquals(range) {
        const current = this.virtualList.visibleRange;
        return current && current.start === range.start && current.end === range.end;
    }

    /**
     * 渲染虚拟列表项
     * @param {number} startIndex
     * @param {number} endIndex
     * @private
     */
    _renderVirtualItems(startIndex, endIndex) {
        // 清空容器
        this.itemsContainer.innerHTML = '';
        
        // 设置容器高度
        const totalHeight = this.filteredItems.length * this.virtualList.itemHeight;
        this.itemsContainer.style.height = `${totalHeight}px`;
        this.itemsContainer.style.position = 'relative';
        
        // 渲染可见项
        for (let i = startIndex; i < endIndex; i++) {
            const item = this.filteredItems[i];
            if (!item) continue;
            
            const card = this.renderItemCard(item);
            card.style.position = 'absolute';
            card.style.top = `${i * this.virtualList.itemHeight}px`;
            card.style.left = '0';
            card.style.right = '0';
            this.itemsContainer.appendChild(card);
        }
    }

    /**
     * 渲染商品列表
     * @param {Array} items - 商品列表
     */
    renderItems(items) {
        if (!this.itemsContainer) return;
        
        this.itemsCache = items;
        this.filteredItems = this._filterItems(items, this.currentCategory);
        
        // 检查是否启用虚拟列表
        this.virtualList.enabled = this.filteredItems.length > 50;
        
        // 显示/隐藏空状态
        const emptyState = document.getElementById('shop-empty-state');
        if (emptyState) {
            emptyState.classList.toggle('hidden', this.filteredItems.length > 0);
        }
        
        if (this.filteredItems.length === 0) {
            this.itemsContainer.innerHTML = '';
            return;
        }
        
        if (this.virtualList.enabled) {
            // 使用虚拟列表
            this._updateVisibleItems();
        } else {
            // 普通渲染
            this._renderNormalList();
        }
        
        // 更新金币显示
        this._updateGoldDisplay(this.gameData.gold || 0);
    }

    /**
     * 渲染普通列表
     * @private
     */
    _renderNormalList() {
        this.itemsContainer.innerHTML = '';
        this.itemsContainer.style.height = '';
        this.itemsContainer.style.position = '';
        
        this.filteredItems.forEach(item => {
            const card = this.renderItemCard(item);
            this.itemsContainer.appendChild(card);
        });
    }

    /**
     * 筛选商品
     * @param {Array} items - 商品列表
     * @param {string} category - 分类
     * @returns {Array} 筛选后的商品
     * @private
     */
    _filterItems(items, category) {
        if (category === '全部') {
            return items;
        }
        return items.filter(item => item.category === category);
    }

    /**
     * 渲染单个商品卡片
     * @param {Object} item - 商品数据
     * @returns {HTMLElement} 商品卡片元素
     */
    renderItemCard(item) {
        const card = document.createElement('div');
        card.className = 'shop-item-card';
        card.dataset.itemId = item.id;
        
        // 添加稀有度边框
        const rarityClass = this._getRarityClass(item.rarity);
        card.classList.add(rarityClass);
        
        // 检查购买状态
        const purchaseState = this._getPurchaseState(item);
        
        // 生成卡片内容
        card.innerHTML = `
            <div class="item-icon-wrapper">
                <div class="item-icon">${item.icon || '🎁'}</div>
                ${item.rarity ? `<span class="item-rarity-badge ${rarityClass}">${this._getRarityName(item.rarity)}</span>` : ''}
            </div>
            <div class="item-info">
                <div class="item-header">
                    <h3 class="item-name">${item.name}</h3>
                    ${item.type ? `<span class="item-type-tag">${item.type}</span>` : ''}
                </div>
                <p class="item-description">${item.description || ''}</p>
                <div class="item-effect">${this._formatEffect(item)}</div>
            </div>
            <div class="item-action">
                <div class="item-price">
                    <span class="price-icon">💰</span>
                    <span class="price-value ${purchaseState.canBuy ? '' : 'insufficient'}">${this._formatPrice(item.price)}</span>
                </div>
                <button class="item-buy-btn ${purchaseState.buttonClass}" 
                        data-item-id="${item.id}"
                        ${purchaseState.disabled ? 'disabled' : ''}>
                    ${purchaseState.buttonText}
                </button>
                ${item.purchaseLimit ? `<div class="item-purchase-count">已购买: ${item.purchasedCount || 0}/${item.purchaseLimit}</div>` : ''}
            </div>
        `;
        
        // 绑定购买按钮事件
        const buyBtn = card.querySelector('.item-buy-btn');
        if (buyBtn && !purchaseState.disabled) {
            buyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._handleBuyClick(item);
            });
        }
        
        // 卡片点击事件（显示详情）
        card.addEventListener('click', () => {
            this._showItemDetail(item);
        });
        
        return card;
    }

    /**
     * 获取稀有度CSS类名
     * @param {string} rarity - 稀有度
     * @returns {string}
     * @private
     */
    _getRarityClass(rarity) {
        const rarityMap = {
            'COMMON': 'rarity-common',
            'RARE': 'rarity-rare',
            'EPIC': 'rarity-epic',
            'LEGENDARY': 'rarity-legendary',
            'MYTHIC': 'rarity-mythic'
        };
        return rarityMap[rarity] || 'rarity-common';
    }

    /**
     * 获取稀有度名称
     * @param {string} rarity - 稀有度
     * @returns {string}
     * @private
     */
    _getRarityName(rarity) {
        const nameMap = {
            'COMMON': '普通',
            'RARE': '稀有',
            'EPIC': '史诗',
            'LEGENDARY': '传说',
            'MYTHIC': '神话'
        };
        return nameMap[rarity] || '普通';
    }

    /**
     * 获取购买状态
     * @param {Object} item - 商品数据
     * @returns {Object}
     * @private
     */
    _getPurchaseState(item) {
        const currentGold = this.gameData.gold || 0;
        const price = this._calculateCurrentPrice(item);
        
        // 检查是否已达到购买上限
        if (item.purchaseLimit && (item.purchasedCount || 0) >= item.purchaseLimit) {
            return {
                canBuy: false,
                disabled: true,
                buttonText: '已达上限',
                buttonClass: 'btn-disabled'
            };
        }
        
        // 检查金币是否足够
        if (currentGold < price) {
            return {
                canBuy: false,
                disabled: true,
                buttonText: '金币不足',
                buttonClass: 'btn-insufficient'
            };
        }
        
        // 检查等级限制
        if (item.levelRequired && (this.gameData.level || 1) < item.levelRequired) {
            return {
                canBuy: false,
                disabled: true,
                buttonText: `需要Lv.${item.levelRequired}`,
                buttonClass: 'btn-locked'
            };
        }
        
        // 可以购买
        return {
            canBuy: true,
            disabled: false,
            buttonText: '购买',
            buttonClass: 'btn-available'
        };
    }

    /**
     * 计算当前价格
     * @param {Object} item - 商品数据
     * @returns {number}
     * @private
     */
    _calculateCurrentPrice(item) {
        if (typeof item.price === 'function') {
            return item.price(item.purchasedCount || 0);
        }
        
        // 价格增长公式
        if (item.priceMultiplier && item.purchasedCount > 0) {
            return Math.floor(item.basePrice * Math.pow(item.priceMultiplier, item.purchasedCount));
        }
        
        return item.price || item.basePrice || 0;
    }

    /**
     * 格式化价格显示
     * @param {number} price - 价格
     * @returns {string}
     * @private
     */
    _formatPrice(price) {
        if (typeof window.NumberFormatter !== 'undefined') {
            const formatter = new NumberFormatter();
            return formatter.format(price);
        }
        
        // 简单格式化
        if (price >= 1e12) return (price / 1e12).toFixed(2) + 'T';
        if (price >= 1e9) return (price / 1e9).toFixed(2) + 'B';
        if (price >= 1e6) return (price / 1e6).toFixed(2) + 'M';
        if (price >= 1e3) return (price / 1e3).toFixed(2) + 'K';
        return price.toString();
    }

    /**
     * 格式化效果描述
     * @param {Object} item - 商品数据
     * @returns {string}
     * @private
     */
    _formatEffect(item) {
        if (!item.effect) return '';
        
        const effects = [];
        
        if (item.effect.dps) {
            effects.push(`DPS +${this._formatPrice(item.effect.dps)}`);
        }
        if (item.effect.clickGold) {
            effects.push(`点击金币 +${this._formatPrice(item.effect.clickGold)}`);
        }
        if (item.effect.critChance) {
            effects.push(`暴击率 +${item.effect.critChance}%`);
        }
        if (item.effect.critMultiplier) {
            effects.push(`暴击倍率 x${item.effect.critMultiplier}`);
        }
        if (item.effect.goldMultiplier) {
            effects.push(`金币倍率 x${item.effect.goldMultiplier}`);
        }
        if (item.effect.duration) {
            effects.push(`持续 ${this._formatDuration(item.effect.duration)}`);
        }
        
        return effects.join(' | ');
    }

    /**
     * 格式化持续时间
     * @param {number} seconds - 秒数
     * @returns {string}
     * @private
     */
    _formatDuration(seconds) {
        if (seconds >= 3600) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}小时${minutes > 0 ? minutes + '分' : ''}`;
        }
        if (seconds >= 60) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes}分钟`;
        }
        return `${seconds}秒`;
    }

    /**
     * 切换分类
     * @param {string} category - 分类名称
     */
    switchCategory(category) {
        if (this.currentCategory === category) return;
        
        this.currentCategory = category;
        
        // 更新标签激活状态
        const tabs = this.categoryTabs.querySelectorAll('.category-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });
        
        // 重新筛选并渲染
        this.filteredItems = this._filterItems(this.itemsCache, category);
        
        // 添加切换动画
        this.itemsContainer.style.opacity = '0';
        this.itemsContainer.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            this.renderItems(this.itemsCache);
            this.itemsContainer.style.opacity = '1';
            this.itemsContainer.style.transform = 'translateX(0)';
        }, 150);
    }

    /**
     * 处理购买点击
     * @param {Object} item - 商品数据
     * @private
     */
    _handleBuyClick(item) {
        const purchaseState = this._getPurchaseState(item);
        
        if (!purchaseState.canBuy) {
            this._showToast(purchaseState.buttonText, 'error');
            return;
        }
        
        // 显示购买确认弹窗
        this.showPurchaseConfirm(item);
    }

    /**
     * 显示购买确认弹窗
     * @param {Object} item - 商品数据
     */
    showPurchaseConfirm(item) {
        const price = this._calculateCurrentPrice(item);
        const currentGold = this.gameData.gold || 0;
        const remainingGold = currentGold - price;
        
        const modalContent = `
            <div class="purchase-confirm">
                <div class="confirm-item-icon">${item.icon || '🎁'}</div>
                <h3 class="confirm-item-name">${item.name}</h3>
                <p class="confirm-item-desc">${item.description || ''}</p>
                <div class="confirm-details">
                    <div class="confirm-row">
                        <span>价格:</span>
                        <span class="confirm-price">💰 ${this._formatPrice(price)}</span>
                    </div>
                    <div class="confirm-row">
                        <span>当前金币:</span>
                        <span>💰 ${this._formatPrice(currentGold)}</span>
                    </div>
                    <div class="confirm-row">
                        <span>购买后剩余:</span>
                        <span class="${remainingGold < 0 ? 'text-error' : 'text-success'}">💰 ${this._formatPrice(remainingGold)}</span>
                    </div>
                </div>
            </div>
        `;
        
        // 使用ModalManager显示确认弹窗
        if (this.uiManager.modalManager) {
            this.uiManager.modalManager.show({
                title: '确认购买',
                content: modalContent,
                buttons: [
                    {
                        text: '取消',
                        class: 'btn-secondary',
                        action: 'cancel'
                    },
                    {
                        text: '确认购买',
                        class: 'btn-primary',
                        action: 'confirm'
                    }
                ]
            }).then(result => {
                if (result === 'confirm') {
                    this._executePurchase(item);
                }
            });
        } else {
            // 简单确认
            if (confirm(`确认购买 ${item.name}？\n价格: ${this._formatPrice(price)} 金币`)) {
                this._executePurchase(item);
            }
        }
    }

    /**
     * 执行购买
     * @param {Object} item - 商品数据
     * @private
     */
    _executePurchase(item) {
        const result = this.shopManager.buyItem(item.id, 1);
        
        if (result.success) {
            this._showToast(`购买成功！获得 ${item.name}`, 'success');
            
            // 更新卡片状态
            this._updateItemCard(item.id);
            
            // 触发购买成功事件
            this.eventBus.emit(GameEvents.ITEM_PURCHASED, {
                item: item,
                result: result
            });
        } else {
            this._showToast(`购买失败: ${result.error || '未知错误'}`, 'error');
        }
    }

    /**
     * 更新单个商品卡片
     * @param {string} itemId - 商品ID
     * @private
     */
    _updateItemCard(itemId) {
        const card = this.itemsContainer.querySelector(`[data-item-id="${itemId}"]`);
        if (!card) return;
        
        // 更新缓存中的商品数据
        const item = this.itemsCache.find(i => i.id === itemId);
        if (!item) return;
        
        // 更新购买次数
        item.purchasedCount = (item.purchasedCount || 0) + 1;
        
        // 重新渲染卡片
        const newCard = this.renderItemCard(item);
        card.replaceWith(newCard);
    }

    /**
     * 更新购买按钮状态
     * @param {string} itemId - 商品ID
     * @param {boolean} canBuy - 是否可购买
     */
    updateBuyButtonState(itemId, canBuy) {
        const card = this.itemsContainer.querySelector(`[data-item-id="${itemId}"]`);
        if (!card) return;
        
        const buyBtn = card.querySelector('.item-buy-btn');
        if (!buyBtn) return;
        
        if (canBuy) {
            buyBtn.disabled = false;
            buyBtn.classList.remove('btn-disabled', 'btn-insufficient');
            buyBtn.classList.add('btn-available');
            buyBtn.textContent = '购买';
        } else {
            buyBtn.disabled = true;
            buyBtn.classList.remove('btn-available');
            buyBtn.classList.add('btn-insufficient');
            buyBtn.textContent = '金币不足';
        }
    }

    /**
     * 更新金币显示
     * @param {number} gold - 金币数量
     * @private
     */
    _updateGoldDisplay(gold) {
        if (this.goldDisplay) {
            this.goldDisplay.textContent = this._formatPrice(gold);
            
            // 添加更新动画
            this.goldDisplay.classList.add('updated');
            setTimeout(() => {
                this.goldDisplay.classList.remove('updated');
            }, 200);
        }
        
        // 更新所有商品卡片的购买状态
        this._updateAllPurchaseStates();
    }

    /**
     * 更新所有商品购买状态
     * @private
     */
    _updateAllPurchaseStates() {
        const cards = this.itemsContainer.querySelectorAll('.shop-item-card');
        cards.forEach(card => {
            const itemId = card.dataset.itemId;
            const item = this.itemsCache.find(i => i.id === itemId);
            if (item) {
                const purchaseState = this._getPurchaseState(item);
                const buyBtn = card.querySelector('.item-buy-btn');
                const priceValue = card.querySelector('.price-value');
                
                if (buyBtn) {
                    buyBtn.disabled = purchaseState.disabled;
                    buyBtn.textContent = purchaseState.buttonText;
                    buyBtn.className = `item-buy-btn ${purchaseState.buttonClass}`;
                }
                
                if (priceValue) {
                    priceValue.classList.toggle('insufficient', !purchaseState.canBuy);
                }
            }
        });
    }

    /**
     * 处理刷新按钮点击
     * @private
     */
    _handleRefresh() {
        const freeRefreshCount = this.shopManager.getFreeRefreshCount();
        
        if (freeRefreshCount <= 0) {
            this._showToast('免费刷新次数已用完', 'warning');
            return;
        }
        
        // 执行刷新
        const result = this.shopManager.refreshShop(true);
        
        if (result.success) {
            this._showToast('商店已刷新', 'success');
            this.renderItems(result.newItems);
            this._updateRefreshCount();
        } else {
            this._showToast('刷新失败，请稍后再试', 'error');
        }
    }

    /**
     * 更新刷新次数显示
     * @private
     */
    _updateRefreshCount() {
        const refreshCountEl = document.getElementById('refresh-count');
        if (refreshCountEl) {
            const freeCount = this.shopManager.getFreeRefreshCount();
            const maxFree = this.shopManager.maxFreeRefresh || 3;
            refreshCountEl.textContent = `(免费: ${freeCount}/${maxFree})`;
        }
    }

    /**
     * 商店刷新事件处理
     * @param {Object} data
     * @private
     */
    _onShopRefreshed(data) {
        if (data.items) {
            this.renderItems(data.items);
        }
        this._updateRefreshCount();
    }

    /**
     * 商品购买事件处理
     * @param {Object} data
     * @private
     */
    _onItemPurchased(data) {
        // 更新金币显示
        this._updateGoldDisplay(this.gameData.gold || 0);
    }

    /**
     * 显示商品详情
     * @param {Object} item - 商品数据
     * @private
     */
    _showItemDetail(item) {
        const detailContent = `
            <div class="item-detail">
                <div class="detail-icon-large">${item.icon || '🎁'}</div>
                <h3 class="detail-name">${item.name}</h3>
                <div class="detail-rarity ${this._getRarityClass(item.rarity)}">
                    ${this._getRarityName(item.rarity)}
                </div>
                <p class="detail-description">${item.description || ''}</p>
                <div class="detail-effects">
                    <h4>效果</h4>
                    ${this._formatEffect(item)}
                </div>
                ${item.levelRequired ? `<div class="detail-requirement">需要等级: Lv.${item.levelRequired}</div>` : ''}
            </div>
        `;
        
        if (this.uiManager.modalManager) {
            this.uiManager.modalManager.show({
                title: '商品详情',
                content: detailContent,
                buttons: [
                    {
                        text: '关闭',
                        class: 'btn-secondary',
                        action: 'close'
                    }
                ]
            });
        }
    }

    /**
     * 显示提示信息
     * @param {string} message - 提示信息
     * @param {string} type - 提示类型
     * @private
     */
    _showToast(message, type = 'info') {
        if (this.uiManager && this.uiManager.showToast) {
            this.uiManager.showToast(message, type);
        } else {
            // 简单提示
            console.log(`[${type}] ${message}`);
        }
    }

    /**
     * 显示加载状态
     * @param {boolean} show
     */
    showLoading(show) {
        const loadingEl = document.getElementById('shop-loading');
        if (loadingEl) {
            loadingEl.classList.toggle('hidden', !show);
        }
        this.isLoading = show;
    }

    /**
     * 显示商店界面
     */
    show() {
        if (this.container) {
            this.container.classList.add('active');
        }
        
        // 触发商店打开事件
        this.eventBus.emit(GameEvents.SHOP_OPENED);
        
        // 加载商品数据
        this._loadShopData();
    }

    /**
     * 隐藏商店界面
     */
    hide() {
        if (this.container) {
            this.container.classList.remove('active');
        }
        
        // 触发商店关闭事件
        this.eventBus.emit(GameEvents.SHOP_CLOSED);
    }

    /**
     * 加载商店数据
     * @private
     */
    _loadShopData() {
        this.showLoading(true);
        
        // 从ShopManager获取商品数据
        const shopData = this.shopManager.getShopItems(this.currentCategory, this.currentPage, this.pageSize);
        
        if (shopData && shopData.items) {
            this.renderItems(shopData.items);
        } else {
            // 使用模拟数据
            this._loadMockData();
        }
        
        this._updateRefreshCount();
        this.showLoading(false);
    }

    /**
     * 加载模拟数据（用于测试）
     * @private
     */
    _loadMockData() {
        const mockItems = [
            {
                id: 'auto_001',
                name: '实习生',
                category: '自动',
                type: '自动点击',
                icon: '👨‍💼',
                description: '帮你自动点击的基础员工',
                rarity: 'COMMON',
                basePrice: 15,
                price: 15,
                priceMultiplier: 1.07,
                effect: { dps: 0.1 },
                purchaseLimit: 100,
                purchasedCount: 0
            },
            {
                id: 'auto_002',
                name: '员工',
                category: '自动',
                type: '自动点击',
                icon: '👨‍💻',
                description: '熟练的员工，效率更高',
                rarity: 'COMMON',
                basePrice: 100,
                price: 100,
                priceMultiplier: 1.08,
                effect: { dps: 1 },
                purchaseLimit: 100,
                purchasedCount: 0
            },
            {
                id: 'buff_001',
                name: '暴击药水',
                category: '增益',
                type: 'BUFF',
                icon: '🧪',
                description: '短时间内提升暴击率',
                rarity: 'RARE',
                price: 500,
                effect: { critChance: 10, duration: 300 },
                purchaseLimit: 10,
                purchasedCount: 0
            },
            {
                id: 'buff_002',
                name: '金币雨',
                category: '增益',
                type: 'BUFF',
                icon: '🌧️',
                description: '获得金币倍率加成',
                rarity: 'EPIC',
                price: 2000,
                effect: { goldMultiplier: 2, duration: 600 },
                purchaseLimit: 5,
                purchasedCount: 0
            },
            {
                id: 'consumable_001',
                name: '时间加速器',
                category: '消耗品',
                type: '消耗品',
                icon: '⏰',
                description: '立即获得10分钟收益',
                rarity: 'RARE',
                price: 1000,
                effect: { instantGold: true },
                purchaseLimit: 20,
                purchasedCount: 0
            },
            {
                id: 'permanent_001',
                name: '黄金手指',
                category: '永久',
                type: '永久升级',
                icon: '👆',
                description: '永久提升点击金币',
                rarity: 'LEGENDARY',
                price: 50000,
                effect: { clickGold: 5 },
                purchaseLimit: 10,
                purchasedCount: 0
            }
        ];
        
        this.renderItems(mockItems);
    }

    /**
     * 销毁商店界面UI
     */
    destroy() {
        // 移除事件监听
        if (this._boundHandlers.onGoldChanged) {
            this.eventBus.off(GameEvents.GOLD_CHANGED, this._boundHandlers.onGoldChanged);
        }
        if (this._boundHandlers.onShopRefreshed) {
            this.eventBus.off(GameEvents.SHOP_REFRESHED, this._boundHandlers.onShopRefreshed);
        }
        if (this._boundHandlers.onItemPurchased) {
            this.eventBus.off(GameEvents.ITEM_PURCHASED, this._boundHandlers.onItemPurchased);
        }
        if (this._boundHandlers.onScroll && this.itemsContainer) {
            this.itemsContainer.removeEventListener('scroll', this._boundHandlers.onScroll);
        }
        
        // 清空DOM引用
        this.container = null;
        this.categoryTabs = null;
        this.itemsContainer = null;
        this.refreshBtn = null;
        this.goldDisplay = null;
        
        // 清空缓存
        this.itemsCache = [];
        this.filteredItems = [];
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShopScreenUI;
} else {
    window.ShopScreenUI = ShopScreenUI;
}
