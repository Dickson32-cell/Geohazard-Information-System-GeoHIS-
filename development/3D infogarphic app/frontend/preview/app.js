// Minimal Three.js preview that reads a simple scene JSON and renders a barChart3D object
(function(){
  const viewer = document.getElementById('viewer');
  const sceneJsonEl = document.getElementById('sceneJson');
  const previewBtn = document.getElementById('previewBtn');
  const fileInput = document.getElementById('fileInput');
  const loadSample = document.getElementById('loadSample');
  const exportBtn = document.getElementById('exportBtn');

  let renderer, scene, camera, controls, clock, mixer;

  function initThree(){
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(viewer.clientWidth, viewer.clientHeight);
    renderer.setClearColor(0x111111);
    viewer.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, viewer.clientWidth/viewer.clientHeight, 0.1, 1000);
    camera.position.set(0,5,10);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    window.controls = controls; // Expose for headless rendering
    clock = new THREE.Clock();

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(5,10,7);
    scene.add(dir);

    window.addEventListener('resize', onResize);
  }

  function onResize(){
    if(!renderer) return;
    renderer.setSize(viewer.clientWidth, viewer.clientHeight);
    camera.aspect = viewer.clientWidth/viewer.clientHeight;
    camera.updateProjectionMatrix();
  }

  function clearScene(){
    if(!scene) return;
    while(scene.children.length>0){
      scene.remove(scene.children[0]);
    }
  }

  function buildSceneFromJSON(obj){
    clearScene();
    // add lights back
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.0));
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(5,10,7);
    scene.add(dir);

    // Ground
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200,200), new THREE.MeshStandardMaterial({color:0x081024,side:THREE.DoubleSide}));
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -0.01;
    scene.add(ground);

    // Simple parser for objects
    const objs = obj.objects || [];
    objs.forEach(o=>{
      if(o.type === 'barChart3D'){
        const data = resolveDataRef(o.dataRef, obj);
        if(data){
          const group = new THREE.Group();
          const cols = data.columns.length;
          const rows = data.rows;
          const spacing = 1.2;
          rows.forEach((r, ri)=>{
            const val = parseFloat(r[1]) || 0;
            const geo = new THREE.BoxGeometry(0.8, Math.max(0.01,val), 0.8);
            const mat = new THREE.MeshStandardMaterial({color:0x22c55e});
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set( (ri - rows.length/2) * spacing, val/2, 0);
            group.add(mesh);
          });
          group.position.set(...(o.position || [0,0,0]));
          scene.add(group);
        }
      }
    });
  }

  function resolveDataRef(ref, obj){
    if(!ref) return null;
    if(obj.tables){
      return obj.tables.find(t=>t.tableId === ref) || obj.tables[0];
    }
    return null;
  }

  function animate(){
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    renderer.render(scene,camera);
  }

  previewBtn.addEventListener('click', ()=>{
    let json;
    try{
      json = JSON.parse(sceneJsonEl.value);
    }catch(e){
      alert('Invalid JSON in scene editor');
      return;
    }
    buildSceneFromJSON(json);
  });

  fileInput.addEventListener('change', (ev)=>{
    const f = ev.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      sceneJsonEl.value = reader.result;
    };
    reader.readAsText(f);
  });

  loadSample.addEventListener('click', ()=>{
    const sample = {
      projectId: 'p-001',
      tables: [
        { source:'sample', tableId:'table-3', columns:['Year','Value'], rows:[[2018,12.5],[2019,15.2],[2020,17.8]] }
      ],
      objects: [ { id:'obj-1', type:'barChart3D', dataRef:'table-3', position:[0,0,0], colorScheme:'vivid' } ]
    };
    sceneJsonEl.value = JSON.stringify(sample, null, 2);
  });

  // Simple export: record canvas for 5 seconds
  exportBtn.addEventListener('click', async ()=>{
    if(!renderer) return;
    const stream = renderer.domElement.captureStream(30);
    const rec = new MediaRecorder(stream, {mimeType:'video/webm;codecs=vp9'});
    const chunks = [];
    rec.ondataavailable = e=>{ if(e.data && e.data.size) chunks.push(e.data); };
    rec.start();
    exportBtn.disabled = true;
    setTimeout(()=>{ rec.stop(); }, 5000);
    rec.onstop = ()=>{
      const blob = new Blob(chunks, {type:'video/webm'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'preview.webm';
      a.click();
      exportBtn.disabled = false;
    };
  });

  // Initialize
  initThree();
  // Try to auto-load scene.json if it exists next to the preview files
  (async function tryLoadSceneFile(){
    try{
      const resp = await fetch('./scene.json', {cache: 'no-store'});
      if(resp.ok){
        const txt = await resp.text();
        if(txt && txt.trim().length>0){
          sceneJsonEl.value = txt;
          try{ const obj = JSON.parse(txt); buildSceneFromJSON(obj); }catch(e){ /* ignore parse errors */ }
          console.info('Loaded scene.json from preview directory');
        }
      }
    }catch(e){
      // no-op; file may not exist or running from file:// which blocks fetch
    }
  })();
  animate();
})();
