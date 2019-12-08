
export CHECKPOINT="../checkpoints/SACQ_MultiRobot-v0_1b51c0e3_2019-11-05_09-10-27g6ibizk2/checkpoint_4000/checkpoint-4000"

for i in {1..100}; do \
    python rollout.py --steps 5000 --checkpoint=$CHECKPOINT  
done