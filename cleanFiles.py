import os
from urllib.parse import quote, unquote

def get_cover_files(cover_dir):
    # 获取封面文件夹中的所有文件名(不含扩展名)
    cover_files = []
    for file in os.listdir(cover_dir):
        # 不需要检查后缀，直接获取文件名
        file_name = os.path.splitext(file)[0]
        cover_files.append(file_name)
    return cover_files

def clean_model_files(model_dir, cover_files):
    # 遍历模型文件夹
    removed = 0
    for file in os.listdir(model_dir):
        file_name = os.path.splitext(file)[0]
        # 对文件名进行 URL 编码后比较
        quoted_file_name = quote(file_name)
        print(quoted_file_name)
        if quoted_file_name not in cover_files:
            os.remove(os.path.join(model_dir, file))
            removed += 1
            print(f"已删除: {file}")
    return removed

def main():
    cover_dir = "./thumbnail/Base_Female_A"
    model_dir = "Base_Female_A"
    
    # 获取封面文件名列表
    cover_files = get_cover_files(cover_dir)

    print(cover_files)
    
    # 清理多余的模型文件
    removed_count = clean_model_files(model_dir, cover_files)
    
    print(f"\n清理完成! 共删除了 {removed_count} 个多余文件")

if __name__ == "__main__":
    main() 