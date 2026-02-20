"""
按钮定位工具 - 使用颜色识别定位UI按钮
仅使用PIL，不需要cv2
"""
from PIL import Image
import json
import sys

def locate_buttons_by_color(image_path):
    """
    通过颜色识别定位按钮
    """
    try:
        img = Image.open(image_path)
    except Exception as e:
        return {"error": f"无法读取图片: {image_path}, {str(e)}"}
    
    width, height = img.size
    pixels = img.load()
    
    results = {
        "image_size": {"width": width, "height": height},
        "buttons": []
    }
    
    # 定义颜色范围 (RGB)
    color_ranges = {
        "blue_button": {
            "description": "蓝色按钮（可能是点击按钮）",
            "min": (50, 100, 150),
            "max": (100, 180, 255)
        },
        "green_button": {
            "description": "绿色按钮（可能是购买按钮）",
            "min": (50, 150, 50),
            "max": (100, 255, 150)
        },
        "orange_button": {
            "description": "橙色按钮",
            "min": (200, 100, 50),
            "max": (255, 180, 100)
        }
    }
    
    # 扫描图片，找到符合颜色范围的区域
    for btn_type, config in color_ranges.items():
        min_color = config["min"]
        max_color = config["max"]
        
        # 收集所有符合颜色的像素点
        matching_pixels = []
        
        for y in range(height):
            for x in range(width):
                pixel = pixels[x, y]
                if len(pixel) >= 3:
                    r, g, b = pixel[0], pixel[1], pixel[2]
                    if (min_color[0] <= r <= max_color[0] and
                        min_color[1] <= g <= max_color[1] and
                        min_color[2] <= b <= max_color[2]):
                        matching_pixels.append((x, y))
        
        if len(matching_pixels) > 100:
            # 计算边界框
            xs = [p[0] for p in matching_pixels]
            ys = [p[1] for p in matching_pixels]
            
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)
            
            center_x = (min_x + max_x) // 2
            center_y = (min_y + max_y) // 2
            
            results["buttons"].append({
                "type": btn_type,
                "description": config["description"],
                "center": {"x": center_x, "y": center_y},
                "bbox": {
                    "x": min_x, 
                    "y": min_y, 
                    "width": max_x - min_x, 
                    "height": max_y - min_y
                },
                "pixel_count": len(matching_pixels)
            })
    
    # 按像素数量排序
    results["buttons"].sort(key=lambda x: x.get("pixel_count", 0), reverse=True)
    
    return results

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "请提供图片路径参数"}))
        return
    
    image_path = sys.argv[1]
    result = locate_buttons_by_color(image_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
