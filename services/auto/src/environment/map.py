from base.single import SingleEnvironment



class MapEnvironment(SingleEnvironment, gym.Env):
	"""
	Environment where the observations are a 2D map
	"""
	pass







class PixelState():
    """
    State represented using pixel maps
    @gridsize: The size of the grid in pixels
    @padding: The padding size to put around the map
    """

    def __init__(self, map, gridsize=0.05, padding=100):
        xmin, xmax, ymin, ymax = self._get_map_size(map)
        self.scale = 1/gridsize
        self.padding = padding
        self.xmin = xmin
        self.ymin = ymin
        px, py = self._to_pixel_coords((xmax, 0, ymax))
        self.nx = px + 2*padding # Number of pixels in the x direction
        self.ny = py + 2*padding # Number of pixels in the y direction
        self.map = np.zeros((self.ny, self.nx), dtype=np.uint16)
        self.checkpoints = np.zeros((self.ny, self.nx), dtype=np.uint16)
        self.target = np.zeros((self.ny, self.nx), dtype=np.uint16)
        self.robots = np.zeros((self.ny, self.nx), dtype=np.uint16)
        self.set_map(map)


    def observe(self, robot_pos, robot_theta=0, view_size=24, rotate=True):
        """
        Return an observation of this state as a numpy array
        """
        stacked = self._stacked()
        robot_x, robot_y = self._to_pixel_coords(robot_pos)

        # Rotate the panel and crop a square section
        if rotate:
            x1 = robot_x - 2*view_size
            x2 = robot_x + 2*view_size
            y1 = robot_y - 2*view_size
            y2 = robot_y + 2*view_size

            stacked = scipy.ndimage.rotate(
                stacked[y1:y2, x1:x2],
                order=0,
                reshape=False,
                angle=robot_theta*180/math.pi
            )
            stacked = np.flip(stacked.transpose(), axis=0)
            robot_y = int(stacked.shape[0]/2)
            robot_x = int(stacked.shape[1]/2)
            
        # Crop so the robot is in the center
        xmin = robot_x - view_size
        xmax = robot_x + view_size
        ymin = robot_y - view_size
        ymax = robot_y + view_size
        cropped = stacked[ymin:ymax, xmin:xmax]
        
        # Make sure the image is large enough
        return pad(cropped, (48,48), (0,0,0))


    def _stacked(self):
        """
        Return the stacked representation of the state
        """
        MAP = 40
        ROBOTS = 70
        TARGET = 200
        CHECKPOINTS = 150
        stacked = MAP*self.map + CHECKPOINTS*self.checkpoints + TARGET*self.target + ROBOTS*self.robots
        stacked = stacked.clip(0, 255).astype(np.uint8)
        return stacked


    def save_image(self, robot_pos, filename=None, cropped=True):
        """
        Save image to file
        """
        if cropped:
            observation = self.observe(robot_pos)
        else:
            observation = self._stacked()
        observation = observation.astype(np.uint8)
        if filename is not None:
            skimage.io.imsave(filename, observation)
        return observation


    def set_map(self, building_map):
        """
        Return a full map of the environment floor
        Usable floor space is colored 0. Walls are colored 1
        """
        height, width = self.map.shape
        img = Image.new('L', (width, height), 0)
        draw = ImageDraw.Draw(img)
        for shape in building_map:
            for polygon in shape['external_polygons']:
                # Y axis is wrong.
                points = [(p[0], -p[1], 0) for p in polygon['points']]
                points = [self._to_pixel_coords(p) for p in points]
                draw.polygon(points, outline=1, fill=None)
        self.map = np.array(img)
        return self.map


    def set_target(self, target_pos):
        """
        Return a full map of the environment showing the target location
        Floor space is colored 0. Targets are colored 1.
        """
        #target_pos, _ = self.physics.getBasePositionAndOrientation(self.targetUniqueId)
        target_x, target_y = self._to_pixel_coords(target_pos)
        # Pixels to color
        xmin = target_x - 2
        xmax = target_x + 3
        ymin = target_y - 2
        ymax = target_y + 3
        # Clip
        xmin = max(xmin, 0)
        xmax = min(xmax, self.nx-1)
        ymin = max(ymin, 0)
        ymax = min(ymax, self.ny-1)
        # Color
        self.target.fill(0)
        self.target[ymin:ymax, xmin:xmax] = 1
        return self.target


    def set_checkpoints(self, checkpoints):
        """
        Return a full map of the environment showing the checkpoint locations
        Floor space is colored 0. Checkpoints are colored 1.
        """
        self.checkpoints.fill(0)
        for ckpt in checkpoints:
            ckpt_x, ckpt_y = self._to_pixel_coords(ckpt)
            # Pixels to color
            xmin = int(ckpt_x - 1)
            xmax = int(ckpt_x + 2)
            ymin = int(ckpt_y - 1)
            ymax = int(ckpt_y + 2)
            # Clip
            xmin = max(xmin, 0)
            xmax = min(xmax, self.nx-1)
            ymin = max(ymin, 0)
            ymax = min(ymax, self.ny-1)
            # Color
            self.checkpoints[ymin:ymax, xmin:xmax] = 1
        return self.checkpoints


    def set_robots(self, robots):
        """
        Return a full map of the environment showing the locations of other robots
        Floor space is colored 0. Other robots are colored 1.
        """
        self.robots.fill(0)
        for enemy_pos, enemy_orn in robots:
            enemy_x, enemy_y = self._to_pixel_coords(enemy_pos)
            # Pixels to color
            xmin = int(enemy_x - 1)
            xmax = int(enemy_x + 2)
            ymin = int(enemy_y - 1)
            ymax = int(enemy_y + 2)
            # Clip
            xmin = max(xmin,0)
            xmax = min(xmax, self.nx-1)
            ymin = max(ymin, 0)
            ymax = min(ymax, self.ny-1)
            # Color
            self.robots[ymin:ymax, xmin:xmax] = 1
        return self.robots


    def _to_pixel_coords(self, pos):
        x = int(self.scale*(pos[0]-self.xmin) + self.padding)
        y = int(self.scale*(pos[1]-self.ymin) + self.padding)
        return x,y


    def _get_map_size(self, building_map):
        xmin = math.inf
        xmax = -math.inf
        ymin = math.inf
        ymax = -math.inf
        for ob in building_map:
            for polygon in ob['external_polygons']:
                for x,y in polygon['points']:
                    xmin = min(x, xmin)
                    xmax = max(x, xmax)
                    ymin = min(y, ymin)
                    ymax = max(y, ymax)
        return xmin, xmax, ymin, ymax
