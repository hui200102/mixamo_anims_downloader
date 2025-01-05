class ModelPreview {
    constructor(container, modelUrl) {
        this.container = container;
        this.modelUrl = modelUrl;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
        
        // 设置渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setClearColor(0xf0f0f0);
        container.appendChild(this.renderer.domElement);

        // 设置相机位置 - 调整为略微俯视的角度
        this.camera.position.set(0, 3, 12); // 增加y轴高度，减小z轴距离
        this.camera.lookAt(0, 0, 0); // 视点对准原点

        // 调整光源以配合新的视角
        const ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        ambientLight.position.set(0, 150, 0);
        this.scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight1.position.set(0, 100, 100);
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight2.position.set(100, 50, 0);
        this.scene.add(directionalLight2);

        // 添加动画相关属性
        this.mixer = null;
        this.clock = new THREE.Clock();

        // 加载模型
        this.loadModel();

        // 开始动画循环
        this.animate();
    }

    loadModel() {
        const loader = new THREE.FBXLoader();
        loader.load(this.modelUrl, (fbx) => {
            // 调整模型大小和位置
            fbx.scale.setScalar(0.4)
            
            // 计算包围盒
            const box = new THREE.Box3().setFromObject(fbx);
            const center = box.getCenter(new THREE.Vector3());
            
            // 将模型居中
            fbx.position.sub(center);
            
            // 设置动画
            this.mixer = new THREE.AnimationMixer(fbx);
            if (fbx.animations.length > 0) {
                const action = this.mixer.clipAction(fbx.animations[0]);
                action.play();
            }
            
            this.scene.add(fbx);
        });
    }

    saveImage() {
        this.renderer.render(this.scene, this.camera);
        const dataURL = this.renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = this.modelUrl.split('/').pop().replace('.fbx', '.png');
        link.click();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // 更新动画
        if (this.mixer) {
            const delta = this.clock.getDelta();
            this.mixer.update(delta);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// 加载模型列表并创建预览
fetch('files.json')
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('previewContainer');
        
        data.forEach(file => {
            if (file.thumbnail) return
            // 创建预览容器
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            // 创建标题
            const title = document.createElement('div');
            title.className = 'preview-title';
            const fileName = file.fileName.split('/').pop().replace('.fbx', '');
            title.textContent = fileName;

            let modelPreview = null;
            
            // 创建下载按钮
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.textContent = '下载';
            downloadBtn.onclick = () => {
                if (modelPreview) {
                    modelPreview.saveImage();
                }
            };

            previewItem.appendChild(title);
            previewItem.appendChild(downloadBtn);
            container.appendChild(previewItem);
            
            // 创建预览
            modelPreview = new ModelPreview(previewItem, file.fileName);
        });
    }); 