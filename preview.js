class ModelPreview {
    constructor(container, modelUrl) {
        this.container = container;
        this.modelUrl = modelUrl;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
        
        // 设置渲染器
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            powerPreference: 'high-performance',
            precision: 'highp',
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio); // 适应设备像素比
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setClearColor(0xf0f0f0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 使用更柔和的阴影
        
        container.appendChild(this.renderer.domElement);

        // 设置相机位置 - 调整为略微俯视的角度
        this.camera.position.set(3, 3, 40); // 增加y轴高度，减小z轴距离
        this.camera.lookAt(0, 0, 0); // 视点对准原点

        // 设置环境光 - 降低到0.4
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        
        // 设置半球光 - 降低到0.2
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.35);
        hemiLight.position.set(0, 200, 0);
        
        // 设置多个方向光 - 都降低到0.2
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.35);
        dirLight1.position.set(200, 200, 200);
        dirLight1.castShadow = true;
        
        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.35);
        dirLight2.position.set(-200, 200, -200);
        
        const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.35);
        dirLight3.position.set(0, -200, 0);

        // 创建光源组
        const lightGroup = new THREE.Group();
        lightGroup.add(ambientLight);
        lightGroup.add(hemiLight);
        lightGroup.add(dirLight1);
        lightGroup.add(dirLight2);
        lightGroup.add(dirLight3);

        this.scene.add(lightGroup);

        const orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        orbitControls.target.set(0, 0, 0);
        orbitControls.minDistance = 5;
        orbitControls.maxDistance = 500;
    
        orbitControls.minPolarAngle = Math.PI / 6;
        orbitControls.maxPolarAngle = Math.PI * 0.7;
    
        orbitControls.listenToKeyEvents(window);
        orbitControls.enableDamping = true;
        orbitControls.dampingFactor = 0.05;

        this.orbitControls = orbitControls

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
            // 提高模型质量
            fbx.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // 如果需要，可以提高材质质量
                    if (child.material) {
                        child.material.side = THREE.DoubleSide;
                        child.material.needsUpdate = true;
                    }
                }
            });
            
            // 调整模型大小和位置
            fbx.scale.setScalar(0.03)
            
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

        this.orbitControls.update()
        
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
            const fileName = file.path.split('/').pop().replace('.fbx', '');
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
            modelPreview = new ModelPreview(previewItem, file.path);
        });
    }); 