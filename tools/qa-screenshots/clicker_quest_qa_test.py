"""
Clicker Quest QA测试脚本
执行点击按钮测试并截图
"""
import asyncio
from playwright.async_api import async_playwright
import os
import sys
from datetime import datetime

async def run_qa_test():
    """执行QA测试流程"""
    
    # 配置
    game_url = "http://localhost:8080/index.html"
    screenshot_dir = "e:\\LLMGameEngine\\projects\\Clicker-Quest\\screenshots"
    
    print("=" * 60)
    print("Clicker Quest QA测试 - 步骤3.1: 点击按钮功能测试")
    print("=" * 60)
    
    async with async_playwright() as p:
        # 启动浏览器
        print("\n[1/5] 启动浏览器...")
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        try:
            # 打开游戏
            print(f"[2/5] 打开游戏页面: {game_url}")
            await page.goto(game_url, wait_until='networkidle')
            
            # 等待游戏加载完成
            print("[3/5] 等待游戏加载...")
            await page.wait_for_selector('#main-click-btn', timeout=10000)
            
            # 获取按钮位置信息
            print("\n[按钮位置分析]")
            click_btn = await page.query_selector('#main-click-btn')
            if click_btn:
                bbox = await click_btn.bounding_box()
                print(f"  - 按钮ID: main-click-btn")
                print(f"  - 按钮文本: 点击我!")
                print(f"  - 位置: x={bbox['x']:.1f}, y={bbox['y']:.1f}")
                print(f"  - 尺寸: {bbox['width']:.1f} x {bbox['height']:.1f}")
                print(f"  - 中心点: ({bbox['x'] + bbox['width']/2:.1f}, {bbox['y'] + bbox['height']/2:.1f})")
            
            # 获取当前金币数量（点击前）
            gold_before = await page.evaluate('''() => {
                const goldEl = document.getElementById('gold-amount');
                return goldEl ? goldEl.textContent : '0';
            }''')
            print(f"\n  - 点击前金币: {gold_before}")
            
            # 执行点击操作
            print("\n[4/5] 执行点击操作...")
            await click_btn.click()
            print("  ✓ 点击已执行")
            
            # 等待动画效果完成
            print("  - 等待动画效果完成 (1秒)...")
            await asyncio.sleep(1)
            
            # 获取点击后金币数量
            gold_after = await page.evaluate('''() => {
                const goldEl = document.getElementById('gold-amount');
                return goldEl ? goldEl.textContent : '0';
            }''')
            print(f"  - 点击后金币: {gold_after}")
            
            # 检查金币是否增加
            if gold_after != gold_before:
                print(f"  ✓ 金币增加: {gold_before} -> {gold_after}")
            else:
                print(f"  ! 金币未变化")
            
            # 截图保存
            print("\n[5/5] 保存操作后截图...")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            screenshot_path = os.path.join(screenshot_dir, f"step3_1_after_clickBtn_{timestamp}.png")
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"  ✓ 截图已保存: {screenshot_path}")
            
            # 测试完成
            print("\n" + "=" * 60)
            print("测试完成!")
            print("=" * 60)
            print(f"\n测试结果:")
            print(f"  - 按钮点击: 成功")
            print(f"  - 金币变化: {gold_before} -> {gold_after}")
            print(f"  - 截图路径: {screenshot_path}")
            
            return {
                'success': True,
                'button_location': {
                    'x': bbox['x'],
                    'y': bbox['y'],
                    'width': bbox['width'],
                    'height': bbox['height'],
                    'center_x': bbox['x'] + bbox['width']/2,
                    'center_y': bbox['y'] + bbox['height']/2
                },
                'gold_before': gold_before,
                'gold_after': gold_after,
                'screenshot_path': screenshot_path
            }
            
        except Exception as e:
            print(f"\n✗ 测试失败: {str(e)}")
            # 保存错误截图
            error_screenshot = os.path.join(screenshot_dir, f"step3_1_error_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
            await page.screenshot(path=error_screenshot, full_page=True)
            print(f"  错误截图已保存: {error_screenshot}")
            return {
                'success': False,
                'error': str(e),
                'screenshot_path': error_screenshot
            }
            
        finally:
            await browser.close()

if __name__ == "__main__":
    result = asyncio.run(run_qa_test())
    sys.exit(0 if result['success'] else 1)
