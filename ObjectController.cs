using System;
using UnityEngine;
namespace AssemblyCSharp
{
	public class ObjectController : MonoBehaviour
	{
		public string label;
		public MasterStream mStream;
		public void Start ()
		{
		}
		public void Update() {
			Vector3 position = Vector3.zero;
			Quaternion rotation = Quaternion.identity;
			if (mStream != null) {
				position = mStream.getLiveObjectPosition (label);
				rotation = mStream.getLiveObjectRotation (label);
			}
			
			SetBodyData(position, rotation);
		}
		public virtual void SetBodyData(Vector3 pos, Quaternion rot) {
			this.transform.localPosition = pos;
			this.transform.localRotation = rot;
		}
	}
}