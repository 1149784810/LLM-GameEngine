/**
 * Clicker Quest - 主入口文件
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 游戏启动入口，初始化GameManager并启动游戏
 */

(function() {
    'use strict';
    
    // 游戏实例
    let game = null;
    
    /**
     * 初始化游戏
     */
    async function initGame() {
        console.log('[Main] 开始初始化游戏...');
        
        try {
            // 显示加载状态
            showLoadingState('正在加载游戏...');
            
            // 创建游戏管理器实例
            game = new GameManager();
            
            // 初始化游戏
            const success = await game.init();
            
            if (success) {
                // 隐藏加载状态
                hideLoadingState();
                
                // 将游戏实例暴露到全局（调试用）
                window.game = game;
                
                console.log('[Main] 游戏启动成功！');
                
                // 绑定页面卸载事件
                bindUnloadEvents();
                
            } else {
                throw new Error('游戏初始化失败');
            }
            
        } catch (error) {
            console.error('[Main] 游戏启动失败:', error);
            showErrorState('游戏启动失败，请刷新页面重试');
        }
    }
    
    /**
     * 显示加载状态
     * @param {string} message - 加载消息
     */
    function showLoadingState(message) {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('show');
            const loadingMessage = loadingOverlay.querySelector('.loading-message');
            if (loadingMessage) {
                loadingMessage.textContent = message;
            }
        }
    }
    
    /**
     * 隐藏加载状态
     */
    function hideLoadingState() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    }
    
    /**
     * 显示错误状态
     * @param {string} message - 错误消息
     */
    function showErrorState(message) {
        hideLoadingState();
        
        const errorOverlay = document.getElementById('error-overlay');
        if (errorOverlay) {
            errorOverlay.classList.add('show');
            const errorMessage = errorOverlay.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.textContent = message;
            }
        } else {
            alert(message);
        }
    }
    
    /**
     * 绑定页面卸载事件
     */
    function bindUnloadEvents() {
        // 页面关闭或刷新时保存游戏
        window.addEventListener('beforeunload', (e) => {
            if (game && game.isRunning) {
                // 同步保存游戏数据
                game.save(false);
            }
        });
        
        // 页面隐藏时暂停游戏
        document.addEventListener('visibilitychange', () => {
            if (game) {
                if (document.hidden) {
                    game.pause();
                } else {
                    game.resume();
                }
            }
        });
        
        // 窗口失焦时暂停游戏
        window.addEventListener('blur', () => {
            if (game && game.isRunning && !game.isPaused) {
                // 可选：失焦时暂停
                // game.pause();
            }
        });
        
        // 窗口获焦时恢复游戏
        window.addEventListener('focus', () => {
            if (game && game.isPaused) {
                // 可选：获焦时恢复
                // game.resume();
            }
        });
    }
    
    /**
     * DOM加载完成后初始化游戏
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }
    
    // 暴露调试接口
    window.ClickerQuest = {
        getGame: () => game,
        getSnapshot: () => game ? game.getSnapshot() : null,
        save: () => game ? game.save(false) : null,
        reset: () => game ? game.reset() : null
    };
    
})();
