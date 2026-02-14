import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import cartopy.feature as cfeature
import os

# 1. 定义地点坐标 (经度, 纬度)
cities_data = [
    ("Beijing", 116.4074, 39.9042),
    ("Guangzhou", 113.2644, 23.1291),
    ("Zhongshan", 113.3928, 22.5170),
    ("Heyuan", 114.7003, 23.7443),
    ("Baoding", 115.4648, 38.8744),
    ("Zhaoqing", 112.4651, 23.0472),
    ("Dongguan", 113.7518, 23.0207),
    ("Zhanjiang", 110.3594, 21.2713),
    ("Zhuhai", 113.5767, 22.2707),
    ("Shenzhen", 114.0579, 22.5431),
    ("Yulin", 110.1613, 22.6368),
    ("Hong Kong", 114.1694, 22.3193),
    ("Dali", 100.2676, 25.6065),
    ("Kunming", 102.8329, 24.8801),
    ("Lijiang", 100.2300, 26.8700)
]

# 2. 确保保存图片的目录存在
output_dir = 'images'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)
    print(f"已创建目录: {output_dir}")

output_path = os.path.join(output_dir, 'world_map.png')

# 3. 创建画布和地图投影
fig = plt.figure(figsize=(20, 10), dpi=300)
ax = fig.add_subplot(1, 1, 1, projection=ccrs.PlateCarree())

# 设置背景色为白色
fig.patch.set_facecolor('white')

# 设置地图范围（全球，但限制纬度范围）
ax.set_extent([-180, 180, -60, 90], crs=ccrs.PlateCarree())

# 4. 添加地图特征
# 使用深蓝色底图
land_color = '#1E3A8A'
ax.add_feature(cfeature.LAND.with_scale('110m'), facecolor=land_color, edgecolor='white', linewidth=0.8)
ax.add_feature(cfeature.OCEAN.with_scale('110m'), facecolor='white')
ax.add_feature(cfeature.COASTLINE.with_scale('110m'), linewidth=0.5, edgecolor='white')
ax.add_feature(cfeature.BORDERS.with_scale('110m'), linestyle='-', edgecolor='white', linewidth=0.5)

# 5. 绘制城市标记点（亮金色）
# 北京和广州使用星星标记，其他城市使用小圆点
gold_color = '#FFD700'
for city, lon, lat in cities_data:
    if city in ['Beijing', 'Guangzhou']:
        # 北京和广州使用星星标记，更大一点
        ax.plot(lon, lat, '*', color=gold_color, markersize=8, 
                transform=ccrs.PlateCarree(), zorder=5, markeredgewidth=0)
        # 添加文本标签（带文本框）
        ax.text(lon, lat + 2, city, transform=ccrs.PlateCarree(), 
                fontsize=8, color='black', weight='bold',
                fontfamily='serif',
                bbox=dict(boxstyle='round,pad=0.3', facecolor='white', 
                         edgecolor='gray', alpha=0.8, linewidth=0.5),
                ha='center', va='bottom', zorder=6)
    else:
        # 其他城市使用小圆点
        ax.plot(lon, lat, 'o', color=gold_color, markersize=3, 
                transform=ccrs.PlateCarree(), zorder=5, markeredgewidth=0)

# 6. 移除坐标轴边框
ax.spines['geo'].set_visible(False)
ax.set_axis_off()

# 7. 保存图片
plt.savefig(output_path, dpi=300, bbox_inches='tight', pad_inches=0.1, facecolor='white')
print(f"地图已成功保存至: {output_path}")
plt.close()
