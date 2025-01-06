// 创建全局渲染器管理器
class RendererManager {
    static instance = null;
    
    static getInstance() {
        if (!RendererManager.instance) {
            const renderer = new THREE.WebGLRenderer({ 
                antialias: true, 
                // powerPreference: 'high-performance',
                precision: 'highp',
                alpha: true
            });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            RendererManager.instance = renderer;
        }
        return RendererManager.instance;
    }
}

class ModelPreview {
    constructor(container, modelUrl) {
        this.container = container;
        this.modelUrl = modelUrl;
        this.isActive = false;
        this.initialized = false;
        
        // 获取共享渲染器
        this.renderer = RendererManager.getInstance();
    }

    initialize() {
        if (this.initialized) return;
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        
        // 调整渲染器尺寸以适应当前容器
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
        
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

        this.initialized = true;
        this.loadModel();
        this.animate();
    }

    cleanup() {
        if (!this.initialized) return;
        
        this.isActive = false;
        
        // 只清理场景和相机，保留渲染器
        this.scene.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        // 移除渲染器的 DOM 元素（但不销毁渲染器）
        if (this.renderer.domElement.parentElement === this.container) {
            this.container.removeChild(this.renderer.domElement);
        }
        
        this.initialized = false;
    }

    loadModel() {
        const loader = new THREE.FBXLoader();
        loader.load(this.modelUrl, (fbx) => {
            // // 提高模型质量
            // fbx.traverse((child) => {
            //     if (child.isMesh) {
            //         child.castShadow = true;
            //         child.receiveShadow = true;
            //         // 如果需要，可以提高材质质量
            //         if (child.material) {
            //             child.material.side = THREE.DoubleSide;
            //             child.material.needsUpdate = true;
            //         }
            //     }
            // });
            
            // 调整模型大小和位置
            fbx.scale.setScalar(0.03)
            
            // // 计算包围盒
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

// 修改事件处理
fetch('files.json')
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('previewContainer');
        let currentActivePreview = null;
        
        data.forEach(file => {
            if (file.thumbnail) return;
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
                    // 添加下载标记
                    downloadBtn.classList.add('downloaded');
                    downloadBtn.textContent = '已下载';
                }
            };

            previewItem.appendChild(title);
            previewItem.appendChild(downloadBtn);

            // 初始化预览
            modelPreview = new ModelPreview(previewItem, file.path);

            // 鼠标进入时激活预览
            previewItem.addEventListener('mouseenter', () => {
                // 清理当前活动的预览
                if (currentActivePreview && currentActivePreview !== modelPreview) {
                    currentActivePreview.cleanup();
                }
                
                if (!modelPreview.initialized) {
                    modelPreview.initialize();
                }
                modelPreview.isActive = true;
                currentActivePreview = modelPreview;
            });

            container.appendChild(previewItem);
        });
    }); 