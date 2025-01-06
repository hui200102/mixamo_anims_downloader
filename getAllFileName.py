import os
from urllib.parse import quote, unquote

def get_all_files(model_directory, cover_directory=None):
    """
    获取指定目录下的所有文件名，并与封面文件对应
    Args:
        model_directory: 模型文件目录路径
        cover_directory: 封面文件目录路径，可选参数
    Returns:
        文件信息列表
    """
    # 获取目录的最后一个文件夹名称
    model_folder_name = quote(os.path.basename(model_directory))
    file_list = []
    
    # 只在 cover_directory 存在时获取封面文件
    cover_files = {}
    if cover_directory and os.path.exists(cover_directory):
        cover_folder_name = quote(os.path.basename(cover_directory))
        cover_files = {os.path.splitext(f)[0]: f for f in os.listdir(cover_directory)}
    
    # 遍历模型文件目录
    for root, dirs, files in os.walk(model_directory):
        for file in files:
            file_name_without_ext = os.path.splitext(file)[0]
            file_info = {
                "label": file_name_without_ext,
                "path": f'{model_folder_name}/{quote(file)}',
            }
            print(file_name_without_ext)

            # 只在有封面目录时才查找封面
            if cover_files:
                quote_file_name_without_ext = quote(file_name_without_ext)
                if quote_file_name_without_ext in cover_files:
                    file_info["thumbnail"] = f'{model_folder_name}/{quote(cover_files[quote_file_name_without_ext])}'
            
            file_list.append(file_info)
    
    return file_list

if __name__ == "__main__":
    # 示例：获取当前目录下的所有文件
    model_dir = "./Anime_Female_A"
    cover_dir = "./Anime_Female_A_cover"  # 封面文件夹路径
    files = get_all_files(model_dir, cover_dir)
    
    # 将文件列表保存为JSON文件
    import json
    with open('files.json', 'w', encoding='utf-8') as f:
        json.dump(files, f, indent=4, ensure_ascii=False)
    print("JSON文件已生成：files.json")
