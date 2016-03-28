
using UnityEngine;
using System.Collections;

public class Network : MonoBehaviour {

		//import SimpleJSON;
		static KDTree kdtree;
		static Vector3[] uniquePoints; 
		static Color[] colorList; 
		static Color[] ptColorList;
		static int[] identityList;

		static string[] idList;

		static Hashtable positionLookup= new Hashtable();
		static Hashtable colorLookup= new Hashtable();
		static Hashtable neighborLookup= new Hashtable();
		static Hashtable indexLookup= new Hashtable();
		static int[] indicesMaster;

		static int selectedIndex = -1;
		static Color savedColor= new Color(0,0,0,0);
		static Color highlightColor= new Color(1,1,1,0.1f);

		public Transform finger;
		public GameObject tooltip;
		public HandInputController HIC1;

		public GameObject imagePlane;
		bool highLighted= false;

		float fps= 0;
		float frames= 0;
		static float opacity = 0.05f;
		static float scaling= 500.0f;
		static float cccc= 0;
		static Mesh nodesMesh;
		static Mesh edgesMesh;
		public float offset= -7.22f;
		public GameObject sphere;

		Hashtable content= new Hashtable();
		int handStatus;

		public string url = "localhost:9000/api/list";


		void Start (){
				WWW www = new WWW(url);
				StartCoroutine (loadData (www));
		} 

		IEnumerator loadData(WWW www){
				yield return www;
				Debug.Log(www.error);

				content = JsonUtility.FromJson<Hashtable>(www.text);
				Debug.Log(content);

				processData(content);
				UpdateMeshes();
		}

		void Update (){

				fps += 1.0f / Time.deltaTime;
				frames++;
				if(frames%600 ==0){
						Debug.Log("AVG FPS: " +  fps / frames);
				}
		}
		void  testUpdate (){

		}

		void  ColorMap (int index){

		}

		public static void  unHighlight (int index){
				GameObject nodesChild = GameObject.Find("Network/Nodes");
				GameObject edgesChild = GameObject.Find("Network/Edges");

				MeshFilter nodeMeshFilter = nodesChild.GetComponent<MeshFilter>();
				Mesh nodesMesh = nodeMeshFilter.mesh;

				MeshFilter edgeMeshFilter = edgesChild.GetComponent<MeshFilter>();
				Mesh edgesMesh = edgeMeshFilter.mesh;

				if( selectedIndex >= 0 ){
						Color nsColor= new Color(savedColor[0],savedColor[0],savedColor[0],1);
						Color esColor= new Color(savedColor[0],savedColor[0],savedColor[0], opacity);
						nodesMesh.colors[selectedIndex] = nsColor;
						edgesMesh.colors[selectedIndex] = esColor;
				}
				selectedIndex = -1;
		}

		void  highlight (){
				//Vector3 p = new Vector3(finger.position.x , finger.position.y, finger.position.z);

				Vector3 p= sphere.transform.position;
				offset = this.transform.position.y; 

				p -= this.transform.position;
				p /= this.transform.localScale.x;
				int index = kdtree.FindNearest(p);
				highlightIndex(index);
		}

		void  highlightIndex ( int index ){
				GameObject edgesChild = GameObject.Find("Edges");
				Color[] cs = colorList;
				Color[] ptCs = ptColorList;

				if( selectedIndex >= 0 ){
						Color nsColor= new Color(savedColor[0],savedColor[1],savedColor[2],1);
						Color esColor= new Color(savedColor[0],savedColor[1],savedColor[2], opacity);
						cs[selectedIndex] = esColor;
						ptCs[selectedIndex] = nsColor;
				}

				savedColor = cs[index];
				cs[index] = highlightColor;
				ptCs[index] = highlightColor;
				selectedIndex = index;

				nodesMesh.vertices = uniquePoints;
				edgesMesh.vertices = uniquePoints;

				nodesMesh.colors  = ptCs;
				edgesMesh.colors  = cs;

				Hashtable ht = (Hashtable) positionLookup[index];
				Vector3 location = (Vector3) uniquePoints[index];

				location *= this.transform.localScale.x;
				location += this.transform.position;
				if(tooltip.GetComponent<TextMesh>().text != ht["screen_name"]){
						tooltip.transform.position = location + new Vector3(0,0.03f,0);	
						tooltip.GetComponent<TextMesh>().text = (string) ht["screen_name"];
				}
				tooltip.transform.LookAt(2 * tooltip.transform.position - Camera.main.transform.position);

		}

		IEnumerator loadImage(string url){
				WWW www = new WWW(url);
				yield return www;
				if(www.error != null){
					Debug.Log(url);
					Renderer renderer = imagePlane.GetComponent<Renderer>();
					www.LoadImageIntoTexture((Texture2D) renderer.material.mainTexture);
				}
				else{
					Debug.Log(www.error);
				}
		}

		void  processData ( Hashtable content  ){
				print (content);
				foreach(string key in content.Keys)
				{
						print(string.Format("{0}: ", key));
				}
				ArrayList nodes = new ArrayList ();
				ArrayList edges = new ArrayList ();

				positionLookup = processNodes(nodes);
				Debug.Log("done w/ nodes");
				Debug.Log("node count: " + content["nodes"]);

				indicesMaster = processEdges((ArrayList) content["edges"], indicesMaster);
				Debug.Log("done w/ edges");
				Debug.Log("edge count * 2: " + content["edges"]);
		}

		void  createMeshObject ( Mesh mesh ,   string name ,   Vector3[] points ,   Color[] colors ,   int[] indices ,   MeshTopology topoType  ){

				GameObject meshObject = new GameObject(name);
				Material material= new Material(Shader.Find ("Mobile/Particles/Additive"));
				if( name == "Nodes" ){
						material = new Material(Shader.Find ("Mobile/Particles/Alpha Blended"));
				}

				meshObject.transform.parent = this.transform;
				meshObject.transform.localScale = new Vector3(1,1,1);
				meshObject.transform.localPosition = new Vector3(0,0,0);

				meshObject.AddComponent<MeshRenderer>();
				MeshRenderer renderer = meshObject.GetComponent<MeshRenderer>();
				renderer.material = material;

				meshObject.AddComponent<MeshFilter>();
				MeshFilter filter = meshObject.GetComponent <MeshFilter>();
				filter.mesh = mesh;

				mesh.MarkDynamic();
				mesh.vertices = points;
				mesh.colors = colors;
				mesh.SetIndices(indices, topoType, 0);
		}

		void  UpdateMeshes (){
				
				nodesMesh = new Mesh();
				edgesMesh = new Mesh();
				print (uniquePoints);
				print (indicesMaster);
				createMeshObject(edgesMesh, "Edges", uniquePoints, colorList, indicesMaster, MeshTopology.Lines);
				//createMeshObject(nodesMesh, "Nodes", uniquePoints, ptColorList, identityList, MeshTopology.Points);
		}


		Hashtable  processNodes ( ArrayList nodes  ){
				Hashtable nodeLookup= new Hashtable();
				int ind= 0;

				// set global vars

				uniquePoints = new Vector3[nodes.Count];
				idList = new string[nodes.Count];
				colorList = new Color[nodes.Count];
				ptColorList = new Color[nodes.Count];
				identityList = new int[nodes.Count];

				for(int i= 0; i < nodes.Count; i++){
						identityList[i] = i;
				}
				foreach(Hashtable ht in nodes){      
						string id= ht["id"].ToString();

						ArrayList poslist = (ArrayList) ht["positions"]; 
						ArrayList pos = (ArrayList) poslist[0];
						ArrayList rgblist = (ArrayList) ht["colors"];
						ArrayList rgb = (ArrayList) rgblist[0];

						float x=  float.Parse(pos[0].ToString());
						float y=  float.Parse(pos[1].ToString());
						float z=  float.Parse(pos[2].ToString());

						nodeLookup[ind] = ht;
						uniquePoints[ind] = new Vector3(x,y,z);
						idList[ind] = id;
						indexLookup[id] = ind;

						float r = (float) rgb[0];
						float g = (float) rgb[1];
						float b = (float) rgb[2];
						float div = 256.00000f;
						Color c;
						Color cpt;

						c = new Color(r/div, g/div, b/div, opacity);
						cpt = new Color(r/div, g/div, b/div, 1);

						colorLookup[id] = c;
						colorList[ind] = c;
						ptColorList[ind] = cpt;

						ind ++;
				}
				kdtree = KDTree.MakeFromPoints(uniquePoints);
				return nodeLookup;
		}

		void  addNeighbor ( Hashtable lookup ,   string source ,   string target ,   int index  ){
				if((bool)lookup[source]){
						Hashtable h = (Hashtable) lookup[source];
						ArrayList a = (ArrayList) h["indices"];
						ArrayList b = (ArrayList) h["neighbors"];

						a.Add(index.ToString());
						b.Add(target);
				}
				else{
						lookup[source] = new Hashtable();
						Hashtable localHash = (Hashtable) lookup[source];
						ArrayList aNew = new ArrayList();
						ArrayList bNew = new ArrayList();
						aNew.Add(index.ToString());
						bNew.Add(target);
						localHash["indices"] = aNew;
						localHash["neighbors"] = bNew;
				}	
		}

		int[] processEdges ( ArrayList edges ,   int[] indices  ){   
				indices = new int[2 * edges.Count]; 
				int i= 0;
				int g= 0;
				foreach(Hashtable edge in edges){        
						string source= edge["source"].ToString();
						string target= edge["target"].ToString();
						//addNeighbor(neighborLookup, source, target, i);
						//addNeighbor(neighborLookup, target, source, i + 1);
						indices[i] = (int) indexLookup[source];
						indices[i+1] = (int) indexLookup[target];
						i += 2;
				}
				return indices;
		}

}