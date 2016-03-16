using System;
using UnityEngine;
namespace AssemblyCSharp
{
	public class PlayerController : MonoBehaviour
	{
		public string id;
		public MasterStream mStream;
		public Vector3 offset;

		private void Start() {}

		private void Update() {
			Vector3 cam_position = Vector3.zero;
			Quaternion cam_rotation = Quaternion.identity;
			Vector3 cam_rot_ea;
			if (mStream != null) {
				cam_position = mStream.getLiveObjectPosition (id);
				cam_rotation = mStream.getLiveObjectRotation (id);
			}
			cam_rot_ea = cam_rotation.eulerAngles;

			Quaternion hmd_rotation = Quaternion.identity;


			Quaternion oldOrientation = this.transform.rotation;
			hmd_rotation = UnityEngine.VR.InputTracking.GetLocalRotation (UnityEngine.VR.VRNode.Head);
			float d = Quaternion.Angle (cam_rotation, hmd_rotation * oldOrientation) / 90f;
			//hmd_rotation = OVRManager.display.GetHeadPose(0).orientation;
			this.transform.rotation = Quaternion.Slerp(oldOrientation, cam_rotation * Quaternion.Inverse(hmd_rotation), d * Time.deltaTime);
			//OVRManager.display.RecenterPose();


			this.transform.position = cam_position + this.transform.rotation * offset;
		}
	}
}

