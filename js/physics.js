import * as Three from "three";

export class PhysicsManager {
  constructor() {
    this.initialize();
  }

  initialize() {
    this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    this.dispatcher = new Ammo.btCollisionDispatcher(
      this.collisionConfiguration
    );
    this.broadphase = new Ammo.btDbvtBroadphase();
    this.solver = new Ammo.btSequentialImpulseConstraintSolver();
    this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
      this.dispatcher,
      this.broadphase,
      this.solver,
      this.collisionConfiguration
    );
    this.tmpTransform = new Ammo.btTransform();
    this.rigidBodies = [];
    this.physicsWorld.setGravity(new Ammo.btVector3(0, -15, 0));
  }

  addRigidBody(mesh, rigidBody, mass) {
    this.physicsWorld.addRigidBody(rigidBody.body);

    if (mass > 0) {
      this.rigidBodies.push({
        mesh: mesh,
        rigidBody: rigidBody,
        mass: mass,
      });

      rigidBody.body.setActivationState(4);
    }
  }

  update(delta) {
    this.physicsWorld.stepSimulation(delta, 10);

    for (let i = 0; i < this.rigidBodies.length; ++i) {
      let motionState = this.rigidBodies[i].rigidBody.motionState;
      if (motionState == null) continue;

      motionState.getWorldTransform(this.tmpTransform);
      const pos = this.tmpTransform.getOrigin();
      const quat = this.tmpTransform.getRotation();
      const pos3 = new Three.Vector3(pos.x(), pos.y(), pos.z());
      const quat3 = new Three.Quaternion(
        quat.x(),
        quat.y(),
        quat.z(),
        quat.w()
      );

      this.rigidBodies[i].mesh.position.copy(pos3);
      this.rigidBodies[i].mesh.quaternion.copy(quat3);
    }
  }
}
