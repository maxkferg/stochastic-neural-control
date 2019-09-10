import json
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.pylab as pylab

params = {'legend.fontsize': 'x-large',
          'figure.figsize': (8, 6),
         'axes.labelsize': 'x-large',
         'axes.titlesize':'x-large',
         'xtick.labelsize':'x-large',
         'ytick.labelsize':'x-large'}
pylab.rcParams.update(params)


def colors(i):
	if i==0:
		return np.array([72,113,200])/255
	if i==1:
		return np.array([132,186,100])/255
	if i==2:
		return np.array([246,217,79])/255


def smooth(values):
	smoothed = []
	last = []
	new_values = []
	for i,v in enumerate(values):
		last.append(v)
		if len(last)>5:
			last = last[1:]
		new_values.append(np.mean(last))
	return new_values


def lighten(c, scale=2):
	c = c*scale
	c = np.clip(c, 0, 1)
	return c


def plot_disk():
	with open("data/disk.json") as fd:
		data = json.load(fd)
	realtime = data['realtime']
	state = data['state']
	history = data['history']

	days = np.array(range(len(realtime)))/2
	plt.plot([],[], color=colors(0), label='Building State Subsystem', linewidth=5)
	plt.plot([],[], color=colors(1), label='Real-time Subsystem', linewidth=5)
	plt.plot([],[], color=colors(2), label='State History Subsystem', linewidth=5)

	c = [colors(i) for i in range(3)]
	plt.stackplot(days, state, realtime, history, colors=c)

	plt.xlabel('Time (days)')
	plt.ylabel('Disk Usage (GB)')
	plt.legend(loc='upper left')
	plt.xlim([0,60])
	plt.savefig("plots/disk.png")
	plt.show()


def plot_latency():
	with open("data/latency.json") as fd:
		data = json.load(fd)
	latency = data['latency']
	low = np.array(data['low'])
	high = np.array(data['high'])
	x = np.array(range(len(data['latency'])))
	num_robots = 1+x

	plt.fill_between(num_robots, latency-low, latency+high, facecolor=colors(0), alpha=0.3, label="5th to 95th Percentile")
	plt.fill_between(num_robots, latency-low, latency+high, edgecolor=colors(0), facecolor="none")
	plt.plot(num_robots,latency, color=colors(0), linewidth=2, marker="o", label="Median latency")
	plt.plot(x, len(num_robots)*[50], color="red", linewidth=1, linestyle="dashed", label="P95 Criterion")
	plt.plot(x, len(num_robots)*[26], color="black", linewidth=1, linestyle=":", label="Min Network Latency")
	plt.xlabel('Number of Robots')
	plt.ylabel('Latency (ms)')
	plt.xlim([0,40])
	plt.ylim([25,55])
	plt.legend(loc=(0.5,0.06))
	plt.savefig("plots/latency.png")
	plt.show()


def plot_lag():
	with open("data/lag.json") as fd:
		data = json.load(fd)
	latency = data['lag']
	low = np.array(data['low'])
	high = np.array(data['high'])
	update_rate = np.array(data['update_rate'])
	#x = x
	x = update_rate

	plt.fill_between(update_rate, latency-low, latency+high, facecolor=colors(0), alpha=0.3, label="5th to 95th percentile")
	plt.fill_between(update_rate, latency-low, latency+high, edgecolor=colors(0), facecolor="none")
	plt.plot(update_rate,latency, color=colors(0), linewidth=2, marker="o", label="Median state lag")
	plt.plot(update_rate, len(update_rate)*[200], color="red", linewidth=1, linestyle="dashed", label="P95 criterion")
	plt.plot(update_rate, len(update_rate)*[26], color="black", linewidth=1, linestyle=":", label="Min network latency")
	plt.xlabel('Update Rate (thousand updates/s)')
	plt.ylabel('Building State Lag (ms)')
	plt.xlim([0,200])
	plt.ylim([0,220])
	plt.legend(loc=(0.5,0.06))
	plt.savefig("plots/lag.png")
	plt.show()





if __name__=="__main__":
	#plot_disk()
	#plot_latency()
	plot_lag()