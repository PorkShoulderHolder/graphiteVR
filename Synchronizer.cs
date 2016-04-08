using UnityEngine;
using System.Collections;
using WebSocketSharp;

public class Synchronizer : MonoBehaviour
{


		public string url;
		public GameObject[] objectsToSynch;
		public int alt = 0;
		// Use this for initialization
		WebSocket ws;
		void Start(){
				ws = new WebSocket (url);
				ws.Connect ();
//				ws.OnMessage += (sender, data) => {
//						for (int i = 0; i < objectsToSynch.Length; i++) {
//								objectsToSynch[i] = 
//						}
//				};
//				ws.OnError += (sender, e) => {
//						Debug.Log(e.Message);
//						Debug.Log(e.Exception);
//						Debug.Log(sender);
//					};
//				ws.OnOpen += (sender, e) => {
//						Debug.Log(e);
//						Debug.Log ("Open");	
//				};
				ws.Send ("hello");


		}

		string StringForTranform(Transform transform){
				return transform.position.ToString () + transform.localScale.ToString () + transform.rotation.ToString ();
		}

		string ConstructStringForTransfer(){
				string output = "";
				for (int i = 0; i < objectsToSynch.Length; i++) {
						output = output + "\n" + StringForTranform (objectsToSynch [i].transform);
				}
				return output;
		}

		Vector3 ScaleForPartitions(string[] partitions){
				string[] scaleString = partitions [1].Split (new  [] {","}, System.StringSplitOptions.None);
				return new Vector3 (float.Parse(scaleString [0]), float.Parse(scaleString [1]), float.Parse(scaleString [2]));
		}

		Vector3 PositionForPartitions(string [] partitions){
				string[] positionString = partitions [0].Split (new  [] {","}, System.StringSplitOptions.None);
				return new Vector3 (float.Parse(positionString [0]), float.Parse(positionString [1]), float.Parse(positionString [2]));
		}

		Quaternion RotationForPartitions(string[] partitions){
				string[] rotationString = partitions [2].Split (new  [] {","}, System.StringSplitOptions.None);
				return new Quaternion (float.Parse(rotationString [0]), float.Parse(rotationString [1]),
						float.Parse(rotationString [2]), float.Parse(rotationString[3]));
		}

		void ApplyTransformsForData(string str){
				string[] partitions = str.Split (new  [] {"\n"}, System.StringSplitOptions.None);
				if (partitions.Length != objectsToSynch.Length) {
						print ("Warning: inconsistent update array size inconsistent with incoming data. Not updating");
						return;
				}
				for (int i = 0; i < partitions.Length; i++) {
						string cleanStr = partitions[i].Substring(1,str.Length-1);
						string[] linePartitions = cleanStr.Split (new  [] {")("}, System.StringSplitOptions.None);
						objectsToSynch [i].transform.position = PositionForPartitions (linePartitions);
						objectsToSynch [i].transform.rotation = RotationForPartitions (linePartitions);
						objectsToSynch [i].transform.localScale = ScaleForPartitions (linePartitions);
				}
		}

		// Update is called once per frame
		void Update ()
		{
				if (alt % 60 == 0) {
						ws.Send (ConstructStringForTransfer());
				}
				alt += 1;
		}
}

