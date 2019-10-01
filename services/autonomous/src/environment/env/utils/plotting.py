import plotly.graph_objects as go


def draw_polygon(x,y, show=True, fig=None, line_color='indigo'):
    if fig is None:
        fig = go.Figure()

    # Add shapes
    fig.add_trace(go.Scatter(
        x=x,
        y=y,
        mode='lines',
        line_color=line_color)
    )
    if show:
        fig.show()
    return fig



def draw_shapely():
      fig = None
      for interior in start_polygon.interiors:
        x, y = interior.xy
        fig = draw_polygon(list(x),list(y), show=False, fig=fig, line_color="red")
      x, y = start_polygon.exterior.xy
      draw_polygon(list(x),list(y), show=True, fig=fig)
